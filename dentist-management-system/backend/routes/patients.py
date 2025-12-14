from flask import request, jsonify

from backend.routes import bp
from backend.models import (
    db,
    Patient,
    MedicalRecord,
    MedicalDocument,
    Prescription,
    TreatmentPlan,
)


@bp.route("/api/patients", methods=["GET"])
def get_patients():
    return jsonify([p.to_dict() for p in Patient.query.all()])


@bp.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json() or {}
    patient = Patient(**data)
    db.session.add(patient)
    db.session.commit()
    return jsonify(patient.to_dict()), 201
