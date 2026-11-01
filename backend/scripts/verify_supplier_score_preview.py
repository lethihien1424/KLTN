"""Read-only live-data verification; does not confirm or recalculate stored scores."""
import argparse
from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path
from types import SimpleNamespace

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from src.core.database import engine as configured_engine


def snapshot(conn):
    result = {}
    for name in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).scalars():
        quoted = conn.dialect.identifier_preparer.quote(name)
        result[name] = list(conn.execute(text("SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),'')) FROM public." + quoted + " t")).one())
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("snapshot", "verify")); parser.add_argument("--report", required=True)
    args = parser.parse_args(); path = Path(args.report)
    engine = create_engine(configured_engine.url, connect_args={"connect_timeout": 5}, isolation_level="REPEATABLE READ")
    with engine.connect() as conn:
        conn.exec_driver_sql("SET TRANSACTION READ ONLY")
        before = snapshot(conn)
        if args.mode == "snapshot":
            if path.exists(): raise RuntimeError("Refusing to overwrite before snapshot")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(before, indent=2), encoding="utf-8")
            print(json.dumps({"snapshot": str(path), "protected_tables": len(before)})); return
        saved = json.loads(path.read_text(encoding="utf-8"))
        changed = [name for name in set(saved) | set(before) if saved.get(name) != before.get(name)]
        if changed: raise RuntimeError("Data changed since snapshot: " + ", ".join(sorted(changed)))
        with Session(bind=conn) as db:
            from src.services.supplier_score_preview_service import SupplierScorePreviewService
            service = SupplierScorePreviewService()
            report = service.preview(db, SimpleNamespace(ma_nguoi_dung="read-only-verification"))
            rows = []
            for item in report["nha_cung_cap"]:
                mapping_scores = [Decimal(row["diem"]) for row in item["mapping"] if row["diem"] is not None]
                expected = (sum(mapping_scores) / len(mapping_scores)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if mapping_scores else None
                assert (Decimal(item["diem_moi"]) if item["diem_moi"] is not None else None) == expected
                for mapping in item["mapping"]:
                    parts = [Decimal(criterion["dong_gop"]) for criterion in mapping["tieu_chi"] if criterion["dong_gop"] is not None]
                    if mapping["diem"] is not None: assert abs(sum(parts) - Decimal(mapping["diem"])) < Decimal("0.00000001")
                rows.append({key: item[key] for key in ("ma_ncc", "diem_hien_tai", "diem_moi", "chenh_lech", "do_day_du", "tinh_trang", "so_phieu", "so_dong_kiem_dinh_hop_le")})
            after = snapshot(conn)
            assert before == after, "Preview wrote to live data"
            result = {"read_only": True, "protected_tables": len(after), "changed_tables": [], "tinh_luc": report["tinh_luc"], "suppliers": rows}
            path.with_name(path.stem + "-after.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__": main()
