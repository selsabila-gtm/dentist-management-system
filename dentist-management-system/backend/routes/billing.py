from flask import Blueprint, jsonify, request
from datetime import datetime
from backend.models import db, Invoice, Appointment, Patient

bp = Blueprint("billing", __name__)

def _calculate_billing_for_patient(patient_id: int):
    appts = Appointment.query.filter_by(patient_id=patient_id).all()
    total_cost = 0.0
    for a in appts:
        try:
            total_cost += float(a.cost or 0)
        except (TypeError, ValueError):
            continue

    paid_sum = (db.session.query(db.func.coalesce(db.func.sum(Invoice.amount), 0.0)).filter(Invoice.patient_id == patient_id).scalar() or 0.0)
    outstanding = max(total_cost - paid_sum, 0.0)
    return total_cost, paid_sum, outstanding

@bp.route("/api/patients/<int:patient_id>/billing-summary", methods=["GET"])
def get_billing_summary(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    total_cost, paid_sum, outstanding = _calculate_billing_for_patient(patient_id)
    return jsonify({
        "patient_id": patient_id,
        "patient_name": patient.full_name or f"{patient.first_name or ''} {patient.last_name or ''}".strip(),
        "total_cost": total_cost,
        "total_paid": paid_sum,
        "outstanding": outstanding,
    }), 200

@bp.route("/api/invoices", methods=["GET","POST"])
def invoices_collection():
    if request.method == "GET":
        search = (request.args.get("q") or "").lower().strip()
        patient_id = request.args.get("patient_id")
        sort_by = request.args.get("sort_by", "date")
        sort_dir = request.args.get("sort_dir", "desc")
        query = Invoice.query

        if patient_id:
            try:
                pid = int(patient_id)
                query = query.filter(Invoice.patient_id == pid)
            except ValueError:
                pass

        if sort_by == "amount":
            col = Invoice.amount
        elif sort_by == "due_date":
            col = Invoice.due_date
        else:
            col = Invoice.date

        if sort_dir == "asc":
            query = query.order_by(col.asc())
        else:
            query = query.order_by(col.desc())

        invoices = query.all()
        if search:
            filtered = []
            for inv in invoices:
                name = inv.patient.full_name or f"{inv.patient.first_name or ''} {inv.patient.last_name or ''}".strip() if inv.patient else ""
                combined = f"{name} {inv.invoice_number or ''}".lower()
                if search in combined:
                    filtered.append(inv)
            invoices = filtered
        return jsonify([inv.to_dict() for inv in invoices]), 200

    # POST
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    amount = data.get("amount")
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
    try:
        patient_id = int(patient_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid patient_id"}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    try:
        amount_value = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount_value <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    total_cost, paid_sum, outstanding = _calculate_billing_for_patient(patient_id)
    if outstanding <= 0:
        return jsonify({"error": "This patient has no outstanding balance."}), 400
    if amount_value > outstanding + 1e-6:
        return jsonify({"error": "Amount exceeds outstanding balance.", "outstanding": outstanding}), 400

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    last = Invoice.query.order_by(Invoice.id.desc()).first()
    next_id = (last.id + 1) if last else 1
    invoice_number = f"INV-{datetime.utcnow().year}-{next_id:04d}"

    inv = Invoice(
        patient_id=patient_id,
        appointment_id=data.get("appointment_id"),
        amount=amount_value,
        date=data.get("date") or today_str,
        due_date=data.get("due_date") or today_str,
        invoice_number=data.get("invoice_number") or invoice_number,
    )

    db.session.add(inv)
    db.session.commit()
    return jsonify(inv.to_dict()), 201
