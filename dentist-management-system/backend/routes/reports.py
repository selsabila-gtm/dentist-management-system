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


@bp.route("/api/reports/inventory", methods=["GET"])
def get_inventory_report():
    """
    Get inventory report including stock levels, consumption, and costs
    Query params: date_range (week, month, quarter, year)
    """
    date_range = request.args.get("date_range", "month")

    # TODO: Implement actual inventory tracking
    data = {
        "total_items": 2900,
        "consumed_this_period": 800,
        "total_cost": 3340,
        "low_stock_count": 2,
        "items": [
            {
                "id": 1,
                "item": "Dental Masks",
                "stock": 450,
                "consumed": 120,
                "cost": 890,
                "status": "good",
            },
            {
                "id": 2,
                "item": "Gloves",
                "stock": 1200,
                "consumed": 350,
                "cost": 420,
                "status": "good",
            },
            {
                "id": 3,
                "item": "Syringes",
                "stock": 300,
                "consumed": 85,
                "cost": 650,
                "status": "good",
            },
            {
                "id": 4,
                "item": "Anesthetics",
                "stock": 150,
                "consumed": 45,
                "cost": 1200,
                "status": "low",
            },
            {
                "id": 5,
                "item": "Cotton Rolls",
                "stock": 800,
                "consumed": 200,
                "cost": 180,
                "status": "good",
            },
        ],
    }

    return jsonify(data), 200
