from collections import defaultdict
from decimal import Decimal, localcontext

from fastapi import HTTPException


class QuyDoiBomService:
    """Validate active BOMs and convert product forecasts without early rounding."""

    @staticmethod
    def calculate(forecast_by_product, boms, details):
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
                if bom.he_so_thu_hoi is None or bom.he_so_thu_hoi <= 0:
                    raise HTTPException(422, f"BOM {bom.ma_cong_thuc} có hệ số thu hồi không hợp lệ.")
                lines = details_by_bom.get(bom.ma_cong_thuc, [])
                if not lines:
                    raise HTTPException(422, f"BOM {bom.ma_cong_thuc} không có chi tiết.")
                if any(line.ty_le_phoi_tron is None or line.ty_le_phoi_tron <= 0 for line in lines):
                    raise HTTPException(422, f"BOM {bom.ma_cong_thuc} có tỷ lệ phối trộn không hợp lệ.")
                ratio_total = sum((line.ty_le_phoi_tron for line in lines), Decimal("0"))
                if ratio_total != Decimal("1.0000"):
                    raise HTTPException(422, f"BOM {bom.ma_cong_thuc} phải có tổng tỷ lệ phối trộn bằng 1.0000.")
                input_quantity = forecast_quantity / bom.he_so_thu_hoi
                for line in lines:
                    result[line.ma_nguyen_lieu] += input_quantity * line.ty_le_phoi_tron
        return result
