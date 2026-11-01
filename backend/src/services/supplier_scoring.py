"""Version 2: only measured delivery KPIs; never supplier stock or declared ratios."""
from decimal import Decimal, ROUND_HALF_UP

WEIGHTS = {"quality_ratio": Decimal("0.35"), "on_time_ratio": Decimal("0.30"),
           "full_ratio": Decimal("0.20"), "lead_time": Decimal("0.15")}


def score_mapping(mapping, metrics):
    values = {key: metrics.get(key) for key in WEIGHTS if key != "lead_time"}
    actual_lead = metrics.get("lead_time")
    values["lead_time"] = (min(Decimal("1"), Decimal(mapping.lead_time_ngay) / actual_lead)
                           if actual_lead is not None and actual_lead > 0 else
                           Decimal("1") if actual_lead == 0 else None)
    coverage = sum((WEIGHTS[key] for key, value in values.items() if value is not None), Decimal("0"))
    if not coverage:
        return None, coverage
    total = sum((WEIGHTS[key] * max(Decimal("0"), min(Decimal("1"), value))
                 for key, value in values.items() if value is not None), Decimal("0"))
    return total / coverage * 100, coverage


def evaluate(db, supplier_code, repository):
    from src.services.delivery_kpi_service import DeliveryKpiService
    metrics = DeliveryKpiService.summarize(db, supplier_code)
    samples = [score_mapping(row, metrics) for row in repository.mappings(db, supplier_code)]
    available = [value for value, coverage in samples if value is not None]
    score = ((sum(available, Decimal("0")) / len(available)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
             if available else None)
    coverage = max((coverage for _, coverage in samples), default=Decimal("0"))
    return score, coverage, metrics
