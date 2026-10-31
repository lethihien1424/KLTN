from collections import defaultdict
from decimal import Decimal, localcontext

from fastapi import HTTPException


class QuyDoiBomService:
    """Validate active BOMs and convert product forecasts without early rounding."""

    @staticmethod
    def product_weight_kg(product):
        if product is None:
            raise HTTPException(422, "Thiếu sản phẩm để xác định khối lượng thành phẩm.")
        weight = Decimal(str(product.khoi_luong)) if product.khoi_luong is not None else Decimal("0")
        if not weight.is_finite() or weight <= 0:
            raise HTTPException(422, f"Sản phẩm {product.ma_san_pham} thiếu khối lượng thành phẩm hợp lệ.")
        unit = (product.don_vi_do_luong or "").strip().lower()
        if unit not in ("kg", "g"):
            raise HTTPException(422, f"Sản phẩm {product.ma_san_pham} phải có đơn vị khối lượng kg hoặc g.")
        return weight / Decimal("1000") if unit == "g" else weight

    @staticmethod
    def per_product(product, bom, lines):
        """One source of arithmetic for BOM details and forecast demand (no early rounding)."""
        weight = QuyDoiBomService.product_weight_kg(product)
        recovery = bom.he_so_thu_hoi
        loss = bom.ty_le_hao_hut
        if recovery is None or not recovery.is_finite() or not 0 < recovery <= 1:
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc} có hệ số thu hồi không hợp lệ (phải lớn hơn 0 và không quá 100%).")
        if loss is None or not loss.is_finite() or not 0 <= loss < 1 or recovery + loss != Decimal("1"):
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc}: hệ số thu hồi + tỷ lệ hao hụt phải bằng 100%.")
        if not lines:
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc} không có chi tiết.")
        if any(line.ty_le_phoi_tron is None or not line.ty_le_phoi_tron.is_finite() or not 0 < line.ty_le_phoi_tron <= 1 for line in lines):
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc} có tỷ lệ phối trộn không hợp lệ.")
        if len({line.ma_nguyen_lieu for line in lines}) != len(lines):
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc} bị trùng nguyên liệu.")
        if sum((line.ty_le_phoi_tron for line in lines), Decimal("0")) != Decimal("1"):
            raise HTTPException(422, f"BOM {bom.ma_cong_thuc} phải có tổng tỷ lệ phối trộn bằng 100%.")
        with localcontext() as context:
            context.prec = 40
            total = weight / recovery
            return {
                "khoi_luong_thanh_pham_kg": weight,
                "tong_nguyen_lieu_kg": total,
                "hao_hut_kg": total - weight,
                "chi_tiet": [{"ma_nguyen_lieu": line.ma_nguyen_lieu,
                              "ty_le_phoi_tron": line.ty_le_phoi_tron,
                              "khoi_luong_kg": total * line.ty_le_phoi_tron} for line in lines],
            }

    @staticmethod
    def calculate(forecast_by_product, boms, details, products):
        by_product = defaultdict(list)
        for bom in boms:
            by_product[bom.ma_san_pham].append(bom)
        details_by_bom = defaultdict(list)
        for detail in details:
            details_by_bom[detail.ma_cong_thuc].append(detail)

        result = defaultdict(lambda: Decimal("0"))
        with localcontext() as context:
            context.prec = 40
            for product, forecast_quantity in forecast_by_product.items():
                product_boms = by_product.get(product, [])
                if not product_boms:
                    raise HTTPException(422, f"Sản phẩm {product} không có BOM đang sử dụng.")
                if len(product_boms) != 1:
                    raise HTTPException(422, f"Sản phẩm {product} phải có đúng một BOM đang sử dụng.")
                bom = product_boms[0]
                lines = details_by_bom.get(bom.ma_cong_thuc, [])
                quantities = QuyDoiBomService.per_product(products.get(product), bom, lines)
                for line in quantities["chi_tiet"]:
                    result[line["ma_nguyen_lieu"]] += forecast_quantity * line["khoi_luong_kg"]
        return result
