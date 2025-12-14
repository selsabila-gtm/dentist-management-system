from flask import jsonify, request
from backend.routes import bp

# ---- REPORTS ----
@bp.route("/api/reports/billing", methods=["GET"])
def get_billing_report():
    """
    Get billing report data including revenue, invoices, and collection rates
    Query params: date_range (week, month, quarter, year)
    """
    date_range = request.args.get("date_range", "month")

    # TODO: Implement actual calculations based on appointments and invoices
    # For now, returning mock data structure
    data = {
        "total_revenue": 90000,
        "paid_invoices": 85500,
        "outstanding": 4500,
        "avg_invoice": 245,
        "total_invoices": 367,
        "pending_count": 15,
        "collection_rate": 95,
        "revenue_by_procedure": [
            {"procedure": "Routine Checkup", "count": 145, "revenue": 7250},
            {"procedure": "Teeth Cleaning", "count": 98, "revenue": 9800},
            {"procedure": "Filling", "count": 67, "revenue": 10050},
            {"procedure": "Root Canal", "count": 23, "revenue": 11500},
            {"procedure": "Extraction", "count": 34, "revenue": 5100},
        ],
    }

    return jsonify(data), 200


@bp.route("/api/reports/payments", methods=["GET"])
def get_payments_report():
    """
    Get payment tracking report including paid, unpaid, and partial payments
    Query params: date_range (week, month, quarter, year)
    """
    date_range = request.args.get("date_range", "month")

    # TODO: Implement actual calculations from payment records
    data = {
        "paid": {"count": 312, "amount": 85500},
        "unpaid": {"count": 37, "amount": 4200},
        "partial": {"count": 18, "amount": 300},
        "recent_payments": [
            {
                "id": 1,
                "date": "2025-12-10",
                "patient": "John Doe",
                "invoice": "INV-2341",
                "amount": 250,
                "status": "paid",
            },
            {
                "id": 2,
                "date": "2025-12-10",
                "patient": "Sarah Smith",
                "invoice": "INV-2340",
                "amount": 180,
                "status": "paid",
            },
            {
                "id": 3,
                "date": "2025-12-09",
                "patient": "Mike Johnson",
                "invoice": "INV-2339",
                "amount": 420,
                "status": "partial",
            },
        ],
    }

    return jsonify(data), 200


from datetime import datetime, timedelta

@bp.route("/api/reports/inventory", methods=["GET"])
def get_inventory_report():
    """
    Real inventory report (NO mock data).
    - total_cost = current inventory value (stock * price_per_unit)
    - consumed_this_period = sum of used quantities in completed summaries within date_range
    """
    date_range = request.args.get("date_range", "month")

    RANGE_DAYS = {
        "week": 7,
        "month": 30,
        "quarter": 90,
        "year": 365,
    }

    days = RANGE_DAYS.get(date_range, 30)
    from_dt = datetime.now() - timedelta(days=days)
    from_str = from_dt.strftime("%Y-%m-%d")

    # ---------- helpers ----------
    def safe_int(v, default=0):
        try:
            return int(v)
        except Exception:
            return default

    def safe_float(v, default=0.0):
        try:
            return float(v)
        except Exception:
            return default

    # ---------- 1) compute consumption from summaries.inventory ----------
    # We only count appointments in the selected date range.
    # (Your Appointment.date is a "YYYY-MM-DD" string, so lexical compare works)
    appts_in_range = Appointment.query.filter(Appointment.date >= from_str).all()

    consumed_by_item = {}  # { item_id: qty_consumed_in_period }

    for appt in appts_in_range:
        # Only count completed appointments (recommended)
        if appt.status != "completed":
            continue

        if not appt.summary:
            continue

        inv_list = load_json_field(appt.summary.inventory)

        # Accept multiple possible shapes:
        # {item_id, quantity} OR {id, qty} OR {inventory_item_id, count}
        for entry in inv_list:
            if not isinstance(entry, dict):
                continue

            item_id = entry.get("item_id") or entry.get("id") or entry.get("inventory_item_id")
            qty = entry.get("quantity") or entry.get("qty") or entry.get("count")

            item_id = safe_int(item_id, 0)
            qty = safe_int(qty, 0)

            if item_id > 0 and qty > 0:
                consumed_by_item[item_id] = consumed_by_item.get(item_id, 0) + qty

    # ---------- 2) compute stock + costs ----------
    items = InventoryItem.query.order_by(InventoryItem.item_name).all()

    report_items = []
    total_items = 0
    consumed_this_period = 0
    total_cost = 0.0
    low_stock_count = 0

    for it in items:
        stock = safe_int(it.quantity, 0)
        min_stock = safe_int(it.minimum_stock, 0)
        unit_price = safe_float(it.price_per_unit, 0.0)

        consumed = safe_int(consumed_by_item.get(it.id, 0), 0)

        # ✅ Current inventory value
        current_value = stock * unit_price

        # ✅ Cost of consumed inventory in this period
        consumed_cost = consumed * unit_price

        total_items += stock
        consumed_this_period += consumed
        total_cost += current_value

        status = "low" if stock <= min_stock else "good"
        if status == "low":
            low_stock_count += 1

        report_items.append({
            "id": it.id,
            "item": it.item_name,
            "stock": stock,
            "consumed": consumed,
            "cost": round(current_value, 2),           # ✅ matches "Current inventory value"
            "consumed_cost": round(consumed_cost, 2),  # ✅ what you requested
            "unit_price": round(unit_price, 2),        # optional but useful
            "status": status,
        })

    return jsonify({
        "total_items": total_items,
        "consumed_this_period": consumed_this_period,
        "total_cost": round(total_cost, 2),
        "low_stock_count": low_stock_count,
        "items": report_items,
    }), 200
