"""Generate additive migration SQL; never connect to a database."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable, CreateIndex
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine

parts = ["BEGIN;", "SELECT pg_advisory_xact_lock(20261029,1);"]
for model in (DeliveryReceipt, DeliveryReceiptLine):
    parts.append(str(CreateTable(model.__table__, if_not_exists=True).compile(dialect=postgresql.dialect())) + ";")
    for index in model.__table__.indexes:
        parts.append(str(CreateIndex(index, if_not_exists=True).compile(dialect=postgresql.dialect())) + ";")
parts += ["INSERT INTO schema_migrations(version) VALUES ('20261029_delivery_history') ON CONFLICT DO NOTHING;", "COMMIT;"]
target = Path(__file__).resolve().parents[2] / 'database/migrations/20261029_delivery_history.sql'
target.write_text('\n'.join(line.rstrip() for line in '\n'.join(parts).splitlines()) + '\n', encoding='utf-8')
print(target)
