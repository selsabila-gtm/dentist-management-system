from datetime import datetime
from flask import request, jsonify

from backend.routes import bp
from backend.models import db, Invoice, Patient


@bp.route("/api/invoices", methods=["GET"])
def list_invoices():
    return jsonify([i.to_dict() for i in Invoice.query.all()])


@bp.route("/api/invoices", methods=["POST"])
def create_invoice():
    data = request.get_json() or {}
    invoice = Invoice(**data)
    db.session.add(invoice)
    db.session.commit()
    return jsonify(invoice.to_dict()), 201
