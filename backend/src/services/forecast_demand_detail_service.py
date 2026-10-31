"""Read saved forecasts and explain the current BOM conversion; never run forecasting."""
from collections import defaultdict
from decimal import Decimal, localcontext

from fastapi import HTTPException

from src.repositories.nhu_cau_nguyen_lieu_repository import NhuCauNguyenLieuRepository
from src.services.quy_doi_bom_service import QuyDoiBomService
from src.services.nhu_cau_nguyen_lieu_service import round_quantity


class ForecastDemandDetailService:
    def __init__(self):
        self.repository = NhuCauNguyenLieuRepository()
        self.converter = QuyDoiBomService()

    def read(self, db, code):
        run = self.repository.forecast(db, code)
        if run is None:
            raise HTTPException(404, "Không tìm thấy lịch sử dự báo.")
        rows = self.repository.forecast_details(db, code)
        quantities = defaultdict(lambda: Decimal("0"))
        for row in rows:
            if row.so_luong_du_bao is None or row.so_luong_du_bao < 0:
                raise HTTPException(422, f"Số lượng dự báo không hợp lệ cho sản phẩm {row.ma_san_pham}.")
            quantities[row.ma_san_pham] += Decimal(str(row.so_luong_du_bao))
        products = self.repository.products(db, list(quantities))
        boms = self.repository.active_boms(db, list(quantities))
        lines = self.repository.bom_details(db, [bom.ma_cong_thuc for bom in boms])
        materials = self.repository.materials(db, sorted({line.ma_nguyen_lieu for line in lines}))
        product_results = []
        contributions = defaultdict(list)
        totals = defaultdict(lambda: Decimal("0"))
        with localcontext() as context:
            context.prec = 40
            for product_code, quantity in sorted(quantities.items()):
                product = products.get(product_code)
                item = {
                    "ma_san_pham": product_code,
                    "ten_san_pham": product.ten_san_pham if product else product_code,
                    "so_luong_du_bao": quantity,
                    "bom": None,
                    "loi_bom": None,
                }
                try:
                    product_boms = [bom for bom in boms if bom.ma_san_pham == product_code]
                    # Reuse all validation rules used by the material-demand table.
                    self.converter.calculate({product_code: quantity}, product_boms, lines, products)
                    bom = product_boms[0]
                    bom_lines = [line for line in lines if line.ma_cong_thuc == bom.ma_cong_thuc]
                    converted = self.converter.per_product(product, bom, bom_lines)
                    for line in converted["chi_tiet"]:
                        material = materials.get(line["ma_nguyen_lieu"])
                        if material is None:
                            raise HTTPException(422, f"Nguyên liệu {line['ma_nguyen_lieu']} trong BOM không tồn tại.")
                        if (material.don_vi_do_luong or "").strip().lower() not in ("kg", "g"):
                            raise HTTPException(422, f"Nguyên liệu {line['ma_nguyen_lieu']} phải có đơn vị kg hoặc g.")
                    item["bom"] = {
                        "ma_cong_thuc": bom.ma_cong_thuc,
                        "ten_cong_thuc": bom.ten_cong_thuc,
                        "khoi_luong_thanh_pham_kg": converted["khoi_luong_thanh_pham_kg"],
                        "he_so_thu_hoi": bom.he_so_thu_hoi,
                        "ty_le_hao_hut": bom.ty_le_hao_hut,
                    }
                    for line in converted["chi_tiet"]:
                        material_code = line["ma_nguyen_lieu"]
                        amount = quantity * line["khoi_luong_kg"]
                        totals[material_code] += amount
                        contributions[material_code].append({
                            "ma_san_pham": product_code,
                            "ma_cong_thuc": bom.ma_cong_thuc,
                            "so_luong_du_bao": quantity,
                            "khoi_luong_thanh_pham_kg": converted["khoi_luong_thanh_pham_kg"],
                            "he_so_thu_hoi": bom.he_so_thu_hoi,
                            "ty_le_phoi_tron": line["ty_le_phoi_tron"],
                            "kg_moi_san_pham": line["khoi_luong_kg"],
                            "nhu_cau_kg": amount,
                        })
                except HTTPException as error:
                    item["loi_bom"] = str(error.detail)
                product_results.append(item)
        complete = bool(rows) and all(item["loi_bom"] is None for item in product_results)
        return {
            "ma_lich_su_du_bao": run.ma_lich_su_du_bao,
            "thoi_gian_chay": run.thoi_gian_chay,
            "so_tuan_du_bao": run.so_tuan_du_bao,
            "trang_thai": run.trang_thai,
            "tu_ngay": min((row.tu_ngay for row in rows), default=None),
            "den_ngay": max((row.den_ngay for row in rows), default=None),
            "tong_san_pham": len(quantities),
            "san_pham": product_results,
            "du_bom": complete,
            "nguyen_lieu": [{
                "ma_nguyen_lieu": material_code,
                "ten_nguyen_lieu": materials[material_code].ten_nguyen_lieu,
                "nhu_cau_du_bao_kg": round_quantity(totals[material_code]),
                "cach_tinh": contributions[material_code],
            } for material_code in sorted(totals)] if complete else [],
        }
