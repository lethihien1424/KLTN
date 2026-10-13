import json
import unittest
from datetime import date
from sqlalchemy import select

import test_reason_settings as base_tests
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
from src.routes.don_mua_routes import router as orders, receipt_router
from src.routes.de_xuat_nhap_hang_routes import router as proposals
from src.routes.nguyen_lieu_nha_cung_cap_routes import router as mappings
from src.routes.ton_kho_routes import router as stock
from src.services.activity_audit import bind_actor


class ActivityAuditTests(base_tests.ReasonSettingsTests):
    def setUp(self):
        super().setUp()
        self.permissions.update({
            'NGUYEN_LIEU_CREATE', 'NGUYEN_LIEU_UPDATE', 'NHA_CUNG_CAP_CREATE', 'NHA_CUNG_CAP_UPDATE',
            'DON_MUA_CREATE', 'DON_MUA_UPDATE', 'DON_MUA_APPROVE', 'DON_MUA_REJECT', 'DON_MUA_RECEIVE',
            'DE_XUAT_NHAP_HANG_CREATE', 'DE_XUAT_NHAP_HANG_APPROVE', 'DE_XUAT_NHAP_HANG_REJECT',
            'NGUYEN_LIEU_NCC_CREATE', 'NGUYEN_LIEU_NCC_UPDATE', 'TON_KHO_CREATE', 'TON_KHO_UPDATE',
        })
        for router in (orders, receipt_router, proposals, mappings, stock):
            self.app.include_router(router, prefix='/api')
        self.db.add(NguyenLieuNhaCungCap(ma_nguyen_lieu_ncc='MAP_AUDIT', ma_ncc='NCC_CFG',
            ma_nguyen_lieu='NL_CFG', don_gia_nguyen_lieu=100, so_luong_ton_kho=1000,
            so_luong_book=0, so_luong_xuat=0, lead_time_ngay=1,
            ty_le_chat_luong_dat=1, ty_le_giao_dung_han=1, ty_le_giao_du=1))
        self.db.add(TonKhoNguyenLieu(ma_nguyen_lieu='NL_CFG', ngay_ghi_nhan=date.today(),
            ton_kho_thuc_te=0, so_luong_book=0, ton_kho_an_toan=10, ton_kho_toi_da=10000, trang_thai='DANG_SU_DUNG'))
        self.db.flush()

    def logs(self, **params):
        response = self.client.get('/api/nhat-ky-hoat-dong', params=params)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def request_ok(self, method, path, payload=None):
        result = self.client.request(method, '/api' + path, json=payload)
        self.assertLess(result.status_code, 300, result.text)
        return result.json()

    def order_payload(self, qty=10):
        today = date.today().isoformat()
        return {'ma_ncc': 'NCC_CFG', 'ngay_dat_hang': today, 'ngay_du_kien_giao': today,
                'chi_tiet': [{'ma_nguyen_lieu': 'NL_CFG', 'so_luong_mua': qty}]}

    def test_material_create_update_noop_and_authenticated_actor(self):
        self.request_ok('POST', '/nguyen-lieu', {'ma_nguyen_lieu':'NL_AUDIT', 'ten_nguyen_lieu':'Audit coffee', 'don_vi_do_luong':'kg'})
        self.request_ok('PUT', '/nguyen-lieu/NL_AUDIT', {'ten_nguyen_lieu':'Updated coffee', 'don_vi_do_luong':'kg'})
        logs = self.logs(search='NL_AUDIT')['items']
        self.assertEqual(len(logs), 2)
        latest = logs[0]
        self.assertEqual(latest['du_lieu_truoc'], {'ten_nguyen_lieu':'Audit coffee'})
        self.assertEqual(latest['du_lieu_sau'], {'ten_nguyen_lieu':'Updated coffee'})
        self.assertEqual(latest['ma_nguoi_dung'], 'CFG_TEST')
        self.assertEqual(latest['ho_ten'], 'Config test')
        self.request_ok('PUT', '/nguyen-lieu/NL_AUDIT', {'ten_nguyen_lieu':'Updated coffee', 'don_vi_do_luong':'kg'})
        self.assertEqual(self.logs(search='NL_AUDIT')['total'], 2)
        spoof = self.client.put('/api/nguyen-lieu/NL_AUDIT', json={'ten_nguyen_lieu':'Spoof', 'don_vi_do_luong':'kg', 'ma_nguoi_dung':'ADMIN'})
        self.assertEqual(spoof.status_code, 422)
        self.assertNotIn('mat_khau', json.dumps(logs))
        self.assertNotIn('unused', json.dumps(logs))

    def test_supplier_edit_stop_and_restore(self):
        supplier = self.request_ok('POST', '/nha-cung-cap', {'ten_ncc':'Audit supplier'})
        code = supplier['ma_ncc']
        self.request_ok('PUT', '/nha-cung-cap/' + code, {'ten_ncc':'Supplier changed'})
        reason = self.create(functions=['DOI_TRANG_THAI_NHA_CUNG_CAP'])
        for status in ('NGUNG_HOAT_DONG', 'DANG_HOAT_DONG'):
            self.request_ok('PATCH', '/nha-cung-cap/' + code + '/trang-thai', {'trang_thai':status,'ly_do_id':reason['id']})
        logs = self.logs(search=code)['items']
        self.assertEqual(len(logs), 4)
        self.assertEqual(logs[0]['du_lieu_sau']['trang_thai'], 'DANG_HOAT_DONG')
        self.assertTrue(all(r['module'] == 'Nhà cung cấp' for r in logs))

    def test_order_quantity_approval_receipt_and_rejection(self):
        order = self.request_ok('POST', '/don-mua-nguyen-lieu', self.order_payload())
        code = order['ma_don_mua']
        updated = self.request_ok('PUT', '/don-mua-nguyen-lieu/' + code, self.order_payload(12))
        detail_code = updated['chi_tiet'][0]['ma_chi_tiet_don_mua']
        changes = self.logs(search=detail_code)['items']
        from decimal import Decimal
        self.assertTrue(any(Decimal(r['du_lieu_sau'].get('so_luong_mua', '0')) == 12 for r in changes), changes)
        self.request_ok('PATCH', '/don-mua-nguyen-lieu/' + code + '/duyet')
        approval = self.logs(search=code, hanh_dong='DUYET')['items'][0]
        self.assertEqual(approval['module'], 'Duyệt kế hoạch mua hàng')
        self.assertEqual(approval['du_lieu_sau']['nguoi_duyet'], 'CFG_TEST')
        self.request_ok('PATCH', '/don-mua-nguyen-lieu/' + code + '/nhan-hang', {
            'ngay_giao_thuc_te':date.today().isoformat(), 'chi_tiet':[{'ma_chi_tiet_don_mua':detail_code, 'so_luong_thuc_nhan':12}]})
        self.assertTrue(self.logs(hanh_dong='NHAN_HANG')['items'])
        second = self.request_ok('POST', '/don-mua-nguyen-lieu', self.order_payload())
        self.request_ok('PATCH', '/don-mua-nguyen-lieu/' + second['ma_don_mua'] + '/tu-choi', {'ly_do_tu_choi':'Không cần mua'})
        self.assertTrue(self.logs(hanh_dong='TU_CHOI')['items'])

    def test_proposal_approve_generate_orders_and_reject(self):
        payload = {'chi_tiet':[{'ma_nguyen_lieu':'NL_CFG','ma_ncc':'NCC_CFG','so_luong_de_xuat_kg':10}]}
        proposal = self.request_ok('POST','/de-xuat-nhap-hang', payload)
        code = proposal['ma_de_xuat']
        self.assertTrue(self.logs(search=code, module='Mua hàng')['items'])
        self.request_ok('PATCH','/de-xuat-nhap-hang/' + code + '/duyet')
        self.request_ok('POST','/de-xuat-nhap-hang/' + code + '/tao-don-mua', {'ngay_du_kien_giao':date.today().isoformat()})
        self.assertTrue(self.logs(module='Duyệt kế hoạch mua hàng', hanh_dong='DUYET')['items'])
        other = self.request_ok('POST','/de-xuat-nhap-hang', payload)
        self.request_ok('PATCH','/de-xuat-nhap-hang/' + other['ma_de_xuat'] + '/tu-choi', {'ly_do_tu_choi':'Ngừng mua'})
        self.assertTrue(self.logs(search=other['ma_de_xuat'], hanh_dong='TU_CHOI')['items'])

    def test_pagination_date_filters_permissions_and_read_only(self):
        for n in range(3):
            self.request_ok('POST','/nguyen-lieu', {'ma_nguyen_lieu':f'NL_A{n}', 'ten_nguyen_lieu':f'Coffee {n}', 'don_vi_do_luong':'kg'})
        today = datetime_vietnam_date()
        data = self.logs(module='Nguyên liệu', hanh_dong='TAO_MOI', nguoi_thao_tac='CFG_TEST', tu_ngay=today, den_ngay=today, page_size=1)
        self.assertEqual(data['total'],3)
        self.assertEqual(len(data['items']),1)
        second = self.logs(module='Nguyên liệu', page=2, page_size=1)
        self.assertNotEqual(second['items'][0]['ma_nhat_ky'], data['items'][0]['ma_nhat_ky'])
        self.assertEqual(self.logs(search='Config test')['total'],3)
        self.assertEqual(self.client.get('/api/nhat-ky-hoat-dong?tu_ngay=2026-10-12&den_ngay=2026-10-01').status_code,422)
        self.assertEqual(self.client.delete('/api/nhat-ky-hoat-dong/' + data['items'][0]['ma_nhat_ky']).status_code,404)
        self.permissions.discard('VIEW_AUDIT_LOG')
        self.assertEqual(self.client.get('/api/nhat-ky-hoat-dong').status_code,403)

    def test_rollback_removes_success_log(self):
        from types import SimpleNamespace
        self.db.commit()  # Preserve seeded fixtures within the outer rollback transaction.
        bind_actor(self.db, self.user, SimpleNamespace(method='PUT', url=SimpleNamespace(path='/api/nguyen-lieu/NL_CFG')))
        original = self.db.get(NguyenLieu,'NL_CFG').ten_nguyen_lieu
        self.db.get(NguyenLieu,'NL_CFG').ten_nguyen_lieu = 'Rolled back'
        self.db.flush()
        self.assertTrue(self.db.scalars(select(NhatKyHoatDong)).all())
        self.db.rollback()
        self.assertEqual(self.db.get(NguyenLieu,'NL_CFG').ten_nguyen_lieu,original)
        self.assertEqual(self.db.scalars(select(NhatKyHoatDong)).all(), [])

    def test_stock_and_supply_children_capture_changes(self):
        payload = {'don_gia_nguyen_lieu':125, 'so_luong_ton_kho':1000, 'so_luong_book':0,
                   'so_luong_xuat':0, 'lead_time_ngay':1, 'ty_le_chat_luong_dat':1,
                   'ty_le_giao_dung_han':1, 'ty_le_giao_du':1}
        self.request_ok('PUT','/nguyen-lieu-nha-cung-cap/MAP_AUDIT',payload)
        item = self.logs(search='MAP_AUDIT')['items'][0]
        self.assertEqual(set(item['du_lieu_sau']), {'don_gia_nguyen_lieu'})
        self.request_ok('PUT','/ton-kho-nguyen-lieu/NL_CFG/' + date.today().isoformat(), {
            'ton_kho_thuc_te':50, 'so_luong_book':0, 'ton_kho_an_toan':10, 'ton_kho_toi_da':10000, 'trang_thai':'DANG_SU_DUNG'})
        self.assertTrue(self.logs(module='Nguyên liệu')['items'])

    def test_actual_failed_api_does_not_record_history(self):
        from unittest.mock import patch
        from src.core.database import get_db
        self.db.commit()
        def real_scope():
            with patch('src.core.database.SessionLocal', return_value=self.db), patch.object(self.db, 'close'):
                yield from get_db()
        self.app.dependency_overrides[get_db] = real_scope
        result = self.client.post('/api/nguyen-lieu', json={'ma_nguyen_lieu':'NL_CFG', 'ten_nguyen_lieu':'Existing', 'don_vi_do_luong':'kg'})
        self.assertEqual(result.status_code,409)
        self.assertEqual(self.logs()['items'],[])
        self.assertEqual(self.db.scalars(select(NhatKyHoatDong)).all(),[])

    def test_import_records_each_row_in_transaction(self):
        from unittest.mock import patch
        from src.routes.import_routes import router as imports
        from src.dependencies.auth_dependency import get_current_user
        from src.services.authorization_service import AuthorizationContext
        from src.services.activity_audit import bind_actor
        from fastapi import Request
        from types import SimpleNamespace
        self.app.include_router(imports, prefix='/api')
        def authenticated(request: Request):
            bind_actor(self.db, self.user, request)
            return self.user
        self.app.dependency_overrides[get_current_user] = authenticated
        context = AuthorizationContext(self.user, SimpleNamespace(), frozenset({'IMPORT_NGUYEN_LIEU'}))
        content = b'ten_nguyen_lieu,don_vi_do_luong,trang_thai\nImport coffee,kg,DANG_SU_DUNG\nSecond coffee,kg,DANG_SU_DUNG\n'
        with patch('src.services.data_processing.import_service.AuthorizationService.load', return_value=context):
            result = self.client.post('/api/imports/nguyen-lieu', files={'file':('audit.csv',content,'text/csv')})
        self.assertEqual(result.status_code,200,result.text)
        logs = self.logs(hanh_dong='NHAP_DU_LIEU')['items']
        self.assertEqual(len(logs),2)
        self.assertTrue(all(r['ma_doi_tuong'] and r['ma_nguoi_dung'] == 'CFG_TEST' for r in logs))

    def test_object_history_is_exact_scoped_and_uses_module_view_permission(self):
        for code in ('NL_AUDIT', 'NL_AUDIT2'):
            self.request_ok('POST', '/nguyen-lieu', {'ma_nguyen_lieu':code, 'ten_nguyen_lieu':code, 'don_vi_do_luong':'kg'})
        self.permissions = {'NGUYEN_LIEU_VIEW'}
        count = len(self.db.scalars(select(NhatKyHoatDong)).all())
        path = '/api/nhat-ky-hoat-dong/doi-tuong/nguyen-lieu/NL_AUDIT'
        result = self.client.get(path)
        self.assertEqual(result.status_code,200,result.text)
        self.assertEqual([r['ma_doi_tuong'] for r in result.json()['items']], ['NL_AUDIT'])
        self.assertEqual(result.json()['items'][0]['ma_nguoi_dung'],'CFG_TEST')
        self.assertEqual(self.client.get('/api/nhat-ky-hoat-dong').status_code,403)
        self.assertEqual(self.client.get('/api/nhat-ky-hoat-dong/doi-tuong/nha-cung-cap/NCC_CFG').status_code,403)
        for params in ({'search':'NL_AUDIT'}, {'page':2}, {'hanh_dong':'TAO_MOI'}):
            self.assertEqual(self.client.get(path,params=params).status_code,200)
        self.assertEqual(len(self.db.scalars(select(NhatKyHoatDong)).all()),count)

    def test_order_history_includes_children_and_approval(self):
        order = self.request_ok('POST','/don-mua-nguyen-lieu',self.order_payload())
        code = order['ma_don_mua']
        self.request_ok('PATCH','/don-mua-nguyen-lieu/' + code + '/duyet')
        self.permissions = {'DON_MUA_VIEW'}
        result = self.client.get('/api/nhat-ky-hoat-dong/doi-tuong/don-mua-nguyen-lieu/' + code)
        self.assertEqual(result.status_code,200,result.text)
        rows = result.json()['items']
        self.assertTrue(any(r['ma_doi_tuong'].startswith(code + '/') for r in rows))
        self.assertTrue(any(r['hanh_dong'] == 'DUYET' for r in rows))
        self.assertTrue(all(r['ma_doi_tuong'] == code or r['ma_doi_tuong'].startswith(code + '/') for r in rows))

    def test_aggregate_excludes_login_and_failed_legacy_records(self):
        from uuid import uuid4
        self.request_ok('POST','/nguyen-lieu', {'ma_nguyen_lieu':'NL_AUDIT', 'ten_nguyen_lieu':'Coffee', 'don_vi_do_luong':'kg'})
        for action,module,result in (('DANG_NHAP',None,'THANH_CONG'), ('DANG_XUAT',None,'THANH_CONG'), ('CHINH_SUA','Nguyên liệu','THAT_BAI')):
            self.db.add(NhatKyHoatDong(ma_nhat_ky='NK'+uuid4().hex[:18], ma_nguoi_dung='CFG_TEST', hanh_dong=action, module=module, ket_qua=result))
        self.db.commit()
        rows = self.logs()['items']
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['hanh_dong'],'TAO_MOI')

    def test_login_logout_do_not_create_audit_logs(self):
        from src.services.auth_service import AuthService
        from src.schemas.auth_schema import LoginRequest
        from fastapi import HTTPException
        service = AuthService()
        with self.assertRaises(HTTPException):
            service.login(LoginRequest(ma_nguoi_dung='UNKNOWN', mat_khau='test password'),self.db)
        service.logout(self.user,self.db)
        self.assertEqual(self.db.scalars(select(NhatKyHoatDong)).all(),[])


def datetime_vietnam_date():
    from datetime import datetime
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).date().isoformat()
