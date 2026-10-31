"""Generate a reviewable SQL migration without connecting to any database."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable, CreateIndex
from src.models.stock_movement_model import StockMovement, StockReservation, StockOperation
from src.services.stock_schema_service import INVENTORY_UPGRADE_SQL

target = Path(__file__).resolve().parents[2] / "database/migrations/20261028_inventory_ledger.sql"
dialect = postgresql.dialect()
statements = ["-- Additive only. No existing inventory/order rows are rewritten.\nBEGIN;"]
for model in (StockMovement, StockReservation, StockOperation):
    statements.append(str(CreateTable(model.__table__, if_not_exists=True).compile(dialect=dialect)) + ";")
    for index in model.__table__.indexes:
        statements.append(str(CreateIndex(index, if_not_exists=True).compile(dialect=dialect)) + ";")
statements.extend([INVENTORY_UPGRADE_SQL, "COMMIT;\n"])
target.write_text("\n".join(line.rstrip() for line in "\n".join(statements).splitlines()) + "\n", encoding="utf-8")
print(target)
