import json
import os
import unittest
from types import SimpleNamespace
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.core.database import engine, get_db
from src.dependencies.permission_dependency import get_authorization
from src.services.authorization_service import AuthorizationContext
from src.models.user_model import User
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.san_pham_model import SanPham
from src.models.cong_thuc_model import CongThuc
from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
from src.routes.ly_do_routes import router as reasons
from src.routes.nguyen_lieu_routes import router as materials
from src.routes.cong_thuc_routes import router as recipes
from src.routes.nha_cung_cap_routes import router as suppliers


@unittest.skipUnless(os.environ.get('RBAC_TEST_POSTGRES') == '1', 'Disposable PostgreSQL required')
class ReasonSettingsTests(unittest.TestCase):
    def setUp(self):
        self.connection = engine.connect()
        self.outer = self.connection.begin()
        self.db = Session(bind=self.connection, join_transaction_mode='create_savepoint', expire_on_commit=False)
        self.user = User(ma_nguoi_dung='CFG_TEST', mat_khau='unused', ho_ten='Config test', vai_tro='ADMIN')
        self.db.add(self.user)
        self.db.add(NguyenLieu(ma_nguyen_lieu='NL_CFG', ten_nguyen_lieu='Config test coffee'))
        self.db.flush()
        self.db.add(NhaCungCap(ma_ncc='NCC_CFG', ten_ncc='Config test supplier'))
        self.db.add(SanPham(ma_san_pham='SP_CFG',ten_san_pham='Config product',khoi_luong=1,trang_thai='DANG_KINH_DOANH'))
        self.db.flush()
        self.db.add(CongThuc(ma_cong_thuc='CT_CFG',ma_san_pham='SP_CFG',ten_cong_thuc='Config recipe',he_so_thu_hoi=1,ty_le_hao_hut=0))
        self.db.flush()
        self.db.add(ChiTietCongThuc(ma_chi_tiet_cong_thuc='CTD_CFG',ma_cong_thuc='CT_CFG',ma_nguyen_lieu='NL_CFG',ty_le_phoi_tron=1))
        self.db.flush()
        self.permissions = {'VIEW_REASON_CONFIG', 'CREATE_REASON_CONFIG', 'UPDATE_REASON_CONFIG', 'CHANGE_REASON_CONFIG_STATUS', 'NGUYEN_LIEU_CHANGE_STATUS', 'CONG_THUC_CHANGE_STATUS', 'NHA_CUNG_CAP_CHANGE_STATUS', 'VIEW_AUDIT_LOG'}
        self.app = FastAPI()
        for router in (reasons, materials, recipes, suppliers):
            self.app.include_router(router, prefix='/api')
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.app.dependency_overrides[get_authorization] = lambda: AuthorizationContext(self.user, SimpleNamespace(), frozenset(self.permissions))
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.outer.rollback()
        self.connection.close()

    def create(self, name='Lý do test', functions=None):
        response = self.client.post('/api/ly-do', json={'ten_ly_do':name,'chuc_nang_ap_dung':functions or ['DOI_TRANG_THAI_NGUYEN_LIEU']})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_crud_filters_and_soft_disable(self):
        reason = self.create('Chất lượng nguyên liệu không đạt', ['DOI_TRANG_THAI_NGUYEN_LIEU','DOI_TRANG_THAI_CONG_THUC','DOI_TRANG_THAI_NHA_CUNG_CAP'])
        body = {'ten_ly_do':'Chất lượng test','trang_thai':'DANG_SU_DUNG','chuc_nang_ap_dung':['DOI_TRANG_THAI_CONG_THUC']}
        self.assertEqual(self.client.put('/api/ly-do/'+reason['id'],json=body).status_code,200)
        data=self.client.get('/api/ly-do',params={'search':'Chất lượng test','chuc_nang':'DOI_TRANG_THAI_CONG_THUC','page_size':1}).json()
        self.assertEqual(data['total'],1)
        self.assertEqual(len(data['items']),1)
        self.assertEqual(self.client.patch('/api/ly-do/'+reason['id']+'/trang-thai',json={'trang_thai':'NGUNG_SU_DUNG'}).status_code,200)
        selected=self.client.get('/api/ly-do/ap-dung',params={'chuc_nang':'DOI_TRANG_THAI_CONG_THUC'}).json()
        self.assertNotIn(reason['id'],[r['id'] for r in selected])

    def test_required_fields_and_permissions(self):
        for body in ({'ten_ly_do':'   ','chuc_nang_ap_dung':['DOI_TRANG_THAI_CONG_THUC']},{'ten_ly_do':'test','chuc_nang_ap_dung':[]},{'ten_ly_do':'test','chuc_nang_ap_dung':['INVALID']}):
            self.assertEqual(self.client.post('/api/ly-do',json=body).status_code,422)
        self.permissions=set()
        self.assertEqual(self.client.get('/api/ly-do').status_code,403)
        self.assertEqual(self.client.get('/api/ly-do/ap-dung?chuc_nang=DOI_TRANG_THAI_CONG_THUC').status_code,403)
        self.assertEqual(self.client.get('/api/nhat-ky-hoat-dong').status_code,403)

    def test_change_validates_reason_and_preserves_snapshot(self):
        reason=self.create()
        route='/api/nguyen-lieu/NL_CFG/trang-thai'
        self.assertEqual(self.client.patch(route,json={'trang_thai':'NGUNG_SU_DUNG'}).status_code,422)
        self.assertEqual(self.client.patch(route,json={'trang_thai':'NGUNG_SU_DUNG','ly_do_id':'missing'}).status_code,422)
        response=self.client.patch(route,json={'trang_thai':'NGUNG_SU_DUNG','ly_do_id':reason['id'],'ghi_chu':'Lô test'})
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(self.db.get(NguyenLieu,'NL_CFG').trang_thai,'NGUNG_SU_DUNG')
        logs=self.client.get('/api/nhat-ky-hoat-dong').json()['items']
        snapshot=json.loads(logs[0]['mo_ta'])
        self.assertEqual(snapshot['trang_thai_cu'],'DANG_SU_DUNG')
        self.assertEqual(snapshot['ly_do'],'Lý do test')
        self.assertEqual(logs[0]['ma_nguoi_dung'],'CFG_TEST')
        self.client.put('/api/ly-do/'+reason['id'],json={'ten_ly_do':'Đổi tên','chuc_nang_ap_dung':['DOI_TRANG_THAI_NGUYEN_LIEU']})
        self.client.patch('/api/ly-do/'+reason['id']+'/trang-thai',json={'trang_thai':'NGUNG_SU_DUNG'})
        self.assertEqual(json.loads(self.client.get('/api/nhat-ky-hoat-dong').json()['items'][0]['mo_ta'])['ly_do'],'Lý do test')
        self.assertEqual(self.client.patch(route,json={'trang_thai':'DANG_SU_DUNG','ly_do_id':reason['id']}).status_code,422)

    def test_wrong_function_other_note_and_reactivation(self):
        wrong=self.create(functions=['DOI_TRANG_THAI_CONG_THUC'])
        route='/api/nguyen-lieu/NL_CFG/trang-thai'
        self.assertEqual(self.client.patch(route,json={'trang_thai':'NGUNG_SU_DUNG','ly_do_id':wrong['id']}).status_code,422)
        other=self.create('Khác')
        self.assertEqual(self.client.patch(route,json={'trang_thai':'NGUNG_SU_DUNG','ly_do_id':other['id'],'ghi_chu':'   '}).status_code,422)
        for state in ('NGUNG_SU_DUNG','DANG_SU_DUNG'):
            self.assertEqual(self.client.patch(route,json={'trang_thai':state,'ly_do_id':other['id'],'ghi_chu':'Có ghi chú'}).status_code,200)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(NhatKyHoatDong)),2)

    def test_edit_cannot_bypass_status_permission(self):
        reason=self.create()
        self.permissions.remove('CHANGE_REASON_CONFIG_STATUS')
        result=self.client.put('/api/ly-do/'+reason['id'],json={'ten_ly_do':'test','trang_thai':'NGUNG_SU_DUNG','chuc_nang_ap_dung':['DOI_TRANG_THAI_NGUYEN_LIEU']})
        self.assertEqual(result.status_code,403)

    def test_recipe_and_supplier_statuses_validate_function_and_audit(self):
        for route,function,inactive,active in (
            ('/api/cong-thuc/CT_CFG/trang-thai','DOI_TRANG_THAI_CONG_THUC','NGUNG_SU_DUNG','DANG_SU_DUNG'),
            ('/api/nha-cung-cap/NCC_CFG/trang-thai','DOI_TRANG_THAI_NHA_CUNG_CAP','NGUNG_HOAT_DONG','DANG_HOAT_DONG'),
        ):
            wrong=self.create(functions=['DOI_TRANG_THAI_NGUYEN_LIEU'])
            self.assertEqual(self.client.patch(route,json={'trang_thai':inactive,'ly_do_id':wrong['id']}).status_code,422)
            reason=self.create(functions=[function])
            self.assertEqual(self.client.get('/api/ly-do/ap-dung',params={'chuc_nang':function}).status_code,200)
            for state in (inactive,active):
                result=self.client.patch(route,json={'trang_thai':state,'ly_do_id':reason['id']})
                self.assertEqual(result.status_code,200,result.text)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(NhatKyHoatDong)),4)
