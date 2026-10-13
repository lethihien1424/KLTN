"""Read-only HTTP/DB smoke check. Does not log in or write audit records."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.core.database import engine, get_db
from src.core.security import create_access_token
from src.main import app


def read_only_db():
    with Session(engine) as db:
        db.execute(text('SET TRANSACTION READ ONLY'))
        yield db
        db.rollback()


def main():
    app.dependency_overrides[get_db] = read_only_db
    try:
        with TestClient(app) as client:
            assert client.get('/api/v1/health').json() == {'status': 'healthy', 'database': 'connected'}
            spec = client.get('/openapi.json')
            assert spec.status_code == 200
            assert '/api/roles/{ma_vai_tro}/permissions' in spec.json()['paths']
            print('Health + OpenAPI: PASS')
            for account in ('admin', 'NVBH', 'QLBH', 'MH01', 'QLMH', 'KHO01', 'KHSX01'):
                # The role claim intentionally does not match stored roles.
                client.headers['Authorization'] = 'Bearer ' + create_access_token(account, 'IGNORED_ROLE_CLAIM')
                me = client.get('/api/auth/me')
                if account in ('KHO01', 'KHSX01'):
                    assert me.status_code == 403
                    print(account, 'inactive: 403')
                    continue
                assert me.status_code == 200, me.text
                assert isinstance(me.json()['permissions'], list)
                print(account, '/me: 200,', len(me.json()['permissions']), 'permissions')
                response = client.get('/api/nguyen-lieu')
                assert response.status_code == (200 if account in ('admin', 'MH01', 'QLMH') else 403), response.text
                if account == 'admin':
                    assert client.get('/api/roles').status_code == 200
                    assert client.get('/api/permissions').status_code == 200
            print('Existing user permission checks: PASS (all transactions read-only)')
    finally:
        app.dependency_overrides.clear()


if __name__ == '__main__':
    main()
