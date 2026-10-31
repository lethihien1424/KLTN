"""Exact VND values. Missing evidence never becomes a zero price or partial total."""
from decimal import Decimal, localcontext


def receipt_line_amount(quantity, price):
    if price is None:
        return None
    with localcontext() as context:
        context.prec = 50
        return quantity * price


def receipt_total(amounts):
    amounts = list(amounts)
    if not amounts or any(amount is None for amount in amounts):
        return None
    with localcontext() as context:
        context.prec = 50
        return sum(amounts, Decimal("0"))
