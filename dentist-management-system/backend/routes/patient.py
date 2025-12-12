# backend/routes/patient_routes.py

from flask import jsonify, request, Blueprint

from ..app import db, Patient

patient_bp = Blueprint('patients', __name__, url_prefix='/api')


@patient_bp.route("/patients", methods=["GET"])
def get_patients():
    rows = Patient.query.all()
    result = [
        {"id": p.id, "name": p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip()}
        for p in rows
    ]
    return jsonify(result)


@patient_bp.route("/patients", methods=["POST"])
def create_patient():
    data = request.get_json() or {}
    
    if not data.get("full_name") and not (data.get("first_name") and data.get("last_name")):
        return jsonify({"error": "Patient name is required"}), 400
    
    p = Patient(
        full_name=data.get("full_name"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        date_of_birth=data.get("date_of_birth"),
        phone=data.get("phone"),
        email=data.get("email"),
    )
    
    db.session.add(p)
    db.session.commit()
    
    return jsonify(p.to_dict()), 201


@patient_bp.route("/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    p = Patient.query.get_or_404(patient_id)
    return jsonify(p.to_dict())