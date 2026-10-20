##D:\KLTN\KLTN\backend\reason_tests\test_material_demand.py
import unittest
from decimal import Decimal
from types import SimpleNamespace as Row
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.core.database import get_db
from src.routes.nhu_cau_nguyen_lieu_routes import controller, router
from src.services.nhu_cau_nguyen_lieu_service import NhuCauNguyenLieuService


class MaterialDemandTests(unittest.TestCase):
    def setUp(self):
        self.service = NhuCauNguyenLieuService()
        self.repository = Mock()
        self.service.repository = self.repository
        self.service.incoming.repository = self.repository
        self.repository.forecast.return_value = Row()
        self.repository.forecast_details.return_value = [self.forecast(100)]
        self.repository.active_boms.return_value = [self.bom()]
        self.repository.bom_details.return_value = [self.line()]
        self.repository.materials.return_value = {'NL_TEST': Row(ten_nguyen_lieu='Test')}
        self.inventory = Row(ton_kho_kha_dung=Decimal('20'),
                             ton_kho_an_toan=Decimal('10'), ton_kho_toi_da=Decimal('10000'))
        self.repository.latest_inventories.return_value = {'NL_TEST': self.inventory}
        self.repository.incoming_quantities.return_value = {'NL_TEST': Decimal('5')}
        app = FastAPI()
        app.include_router(router, prefix='/api')
        app.dependency_overrides[get_db] = lambda: None
        # Isolate HTTP error/serialization tests from authentication and live DB.
        permission = router.routes[0].dependencies[0].dependency
        app.dependency_overrides[permission] = lambda: None
        self.service_patch = patch.object(controller, 'service', self.service)
        self.service_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.service_patch.stop()

    @staticmethod
    def forecast(quantity, product='SP0001', legacy=None):
        return Row(ma_san_pham=product, so_luong_du_bao=quantity, so_luong_du_bao_kg=legacy)

    @staticmethod
    def bom(product='SP0001', code='CT_TEST'):
        return Row(ma_san_pham=product, ma_cong_thuc=code, he_so_thu_hoi=Decimal('0.8'))

    @staticmethod
    def line(code='CT_TEST'):
        return Row(ma_cong_thuc=code, ma_nguyen_lieu='NL_TEST', ty_le_phoi_tron=Decimal('1'))

    def preview(self, code='LSDB0002'):
        response = self.client.get('/api/nhu-cau-nguyen-lieu/' + code)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['chi_tiet']

    def test_lsdb0002_839_products_with_null_legacy(self):
        self.repository.forecast_details.return_value = [self.forecast(q) for q in [104] + [105] * 7]
        with patch.object(self.service.converter, 'calculate', wraps=self.service.converter.calculate) as calculate:
            items = self.preview()
        self.assertEqual(calculate.call_args.args[0]['SP0001'], Decimal('839'))
        self.assertEqual(items[0]['nhu_cau_du_bao_kg'], '1048.75')
        self.assertEqual(items[0]['so_luong_can_mua_kg'], '1033.75')
        self.repository.incoming_quantities.assert_called_once_with(None, ['NL_TEST'], ('DA_DUYET',))

    def test_lsdb0001_ignores_legacy_quantity(self):
        self.repository.forecast_details.return_value = [self.forecast(100, legacy=Decimal('9999'))]
        item = self.preview('LSDB0001')[0]
        self.assertEqual(item['nhu_cau_du_bao_kg'], '125.00')
        self.assertEqual(item['so_luong_can_mua_kg'], '110.00')

    def test_null_forecast_returns_business_error(self):
        self.repository.forecast_details.return_value = [self.forecast(100), self.forecast(None)]
        response = self.client.get('/api/nhu-cau-nguyen-lieu/LSDB0002')
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()['detail'], 'Thiếu dữ liệu dự báo cho sản phẩm SP0001.')

    def test_missing_bom_returns_product_error(self):
        self.repository.active_boms.return_value = []
        response = self.client.get('/api/nhu-cau-nguyen-lieu/LSDB0002')
        self.assertEqual(response.status_code, 422)
        self.assertIn('SP0001', response.json()['detail'])

    def test_shared_material_is_aggregated(self):
        self.repository.forecast_details.return_value = [self.forecast(100), self.forecast(60, 'SP0002')]
        self.repository.active_boms.return_value = [self.bom(), self.bom('SP0002', 'CT_SECOND')]
        self.repository.bom_details.return_value = [self.line(), self.line('CT_SECOND')]
        items = self.preview()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['nhu_cau_du_bao_kg'], '200.00')
        self.assertEqual(items[0]['so_luong_can_mua_kg'], '185.00')

    def test_no_shortage_means_no_purchase(self):
        self.inventory.ton_kho_kha_dung = Decimal('130')
        self.assertEqual(self.preview()[0]['so_luong_can_mua_kg'], '0.00')

    def test_purchase_is_capped_by_max_inventory(self):
        self.inventory.ton_kho_toi_da = Decimal('50')
        self.assertEqual(self.preview()[0]['so_luong_can_mua_kg'], '25.00')


if __name__ == '__main__':
    unittest.main()
