// Local Docker development check. Issues short-lived tokens inside the backend
// container; never prints tokens, calls login, or sends a write request.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const docker = process.env.DOCKER_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe' : 'docker');
const script = `
import json
from src.core.database import SessionLocal
from src.core.security import create_access_token
from src.repositories.auth_repository import AuthRepository
tokens={}
with SessionLocal() as db:
    for account in ['admin','MH01','QLMH']:
        user=AuthRepository().get_by_account_id(db,account)
        if user is None or user.trang_thai!='HOAT_DONG':
            raise RuntimeError('Required active demo account is unavailable')
        tokens[account]=create_access_token(account,user.vai_tro)
print(json.dumps(tokens))
`;
const tokens = JSON.parse(execFileSync(docker, ['exec', '-i', 'milano_backend', 'python', '-'], { input: script, encoding: 'utf8' }));
const endpoints = [
  ['/auth/me', null], ['/ly-do', 'VIEW_REASON_CONFIG'], ['/nhat-ky-hoat-dong', 'VIEW_AUDIT_LOG'],
  ['/ly-do/ap-dung?chuc_nang=DOI_TRANG_THAI_NGUYEN_LIEU', 'NGUYEN_LIEU_CHANGE_STATUS'],
  ['/ly-do/ap-dung?chuc_nang=DOI_TRANG_THAI_CONG_THUC', 'CONG_THUC_CHANGE_STATUS'],
  ['/ly-do/ap-dung?chuc_nang=DOI_TRANG_THAI_NHA_CUNG_CAP', 'NHA_CUNG_CAP_CHANGE_STATUS'],
  ['/nguyen-lieu', 'NGUYEN_LIEU_VIEW'], ['/cong-thuc', 'CONG_THUC_VIEW'],
  ['/ton-kho-nguyen-lieu?latest_only=true', 'TON_KHO_VIEW'], ['/nha-cung-cap', 'NHA_CUNG_CAP_VIEW'],
  ['/nguyen-lieu-nha-cung-cap', 'NGUYEN_LIEU_NCC_VIEW'], ['/de-xuat-nhap-hang', 'DE_XUAT_NHAP_HANG_VIEW'],
  ['/don-mua-nguyen-lieu', 'DON_MUA_VIEW'], ['/dashboard/hieu-suat-nha-cung-cap', 'NHA_CUNG_CAP_PERFORMANCE_VIEW'],
  ['/dashboard/tong-quan', 'DASHBOARD_VIEW'], ['/dashboard/canh-bao-ton-kho', 'DASHBOARD_VIEW'], ['/du-bao/lich-su', 'DU_BAO_VIEW'],
];
const results = [];
for (const [account, token] of Object.entries(tokens)) {
  let permissions = [];
  for (const [path, permission] of endpoints) {
    const response = await fetch(`http://localhost:8000/api${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
    const data = await response.json();
    if (path === '/auth/me') permissions = data.permissions ?? [];
    const expected = permission && !permissions.includes(permission) ? 403 : 200;
    results.push({ account, method: 'GET', path, expected, status: response.status, pass: response.status === expected, records: Array.isArray(data) ? data.length : Array.isArray(data.items) ? data.items.length : null, ...(path === '/auth/me' ? { permissions: permissions.length } : {}) });
  }
}
const report = { checked_at: new Date().toISOString(), mode: 'READ_ONLY_GET', total: results.length, passed: results.filter(r => r.pass).length, results };
const directory = fileURLToPath(new URL('../reports/', import.meta.url));
mkdirSync(directory, { recursive: true });
writeFileSync(fileURLToPath(new URL('../reports/API_READONLY_VERIFICATION.json', import.meta.url)), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.passed}/${report.total} real API read checks passed; no database writes.`);
if (report.passed !== report.total) process.exitCode = 1;
