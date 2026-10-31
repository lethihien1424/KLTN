from sqlalchemy import text
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine

VERSION = '20261029_delivery_history'


def upgrade_delivery_schema(engine):
    with engine.begin() as connection:
        connection.execute(text('SELECT pg_advisory_xact_lock(20261029,1)'))
        if connection.scalar(text("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261029_delivery_history')")):
            return
        DeliveryReceipt.__table__.create(connection, checkfirst=True)
        DeliveryReceiptLine.__table__.create(connection, checkfirst=True)
        connection.execute(text("INSERT INTO schema_migrations(version) VALUES ('20261029_delivery_history') ON CONFLICT DO NOTHING"))
