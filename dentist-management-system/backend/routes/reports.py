from flask import jsonify, request
from backend.routes import bp


@bp.route("/api/reports/billing", methods=["GET"])
def billing_report():
    return jsonify({"message": "Billing report placeholder"})
