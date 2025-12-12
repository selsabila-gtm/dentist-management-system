# backend/routes/medical_routes.py

from flask import jsonify, request, Blueprint

from ..app import (
    db,
    Patient,
    MedicalRecord,
    MedicalDocument,
    Prescription,
    TreatmentPlan
)

medical_bp = Blueprint('medical', __name__, url_prefix='/api')


# ---- MEDICAL RECORDS ----
@medical_bp.route("/patients/<int:patient_id>/medical-record", methods=["GET"])
def get_medical_record(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
    documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()

    if record is None:
        record_data = {
            "patient_id": patient_id,
            "past_diagnoses": "",
            "allergies": "",
            "medications": "",
        }
    else:
        record_data = record.to_dict()

    docs_data = [doc.to_dict() for doc in documents]
    
    return jsonify({
        "patient": patient.to_dict(),
        "medical_history": record_data,
        "documents": docs_data
    }), 200


@medical_bp.route("/patients/<int:patient_id>/medical-history", methods=["PUT"])
def update_medical_history(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    data = request.get_json() or {}
    past = data.get("past_diagnoses", "")
    allergies = data.get("allergies", "")
    meds = data.get("medications", "")

    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
    
    if record is None:
        record = MedicalRecord(
            patient_id=patient_id,
            past_diagnoses=past,
            allergies=allergies,
            medications=meds,
        )
        db.session.add(record)
    else:
        record.past_diagnoses = past
        record.allergies = allergies
        record.medications = meds

    db.session.commit()
    
    return jsonify({
        "message": "Medical history saved.",
        "medical_history": record.to_dict()
    }), 200


# ---- MEDICAL DOCUMENTS ----
@medical_bp.route("/patients/<int:patient_id>/documents", methods=["GET", "POST"])
def documents_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    if request.method == "GET":
        documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
        return jsonify([d.to_dict() for d in documents]), 200

    data = request.get_json() or {}
    name = data.get("name")
    date = data.get("date")
    doc_type = data.get("type")
    
    if not name or not date or not doc_type:
        return jsonify({"error": "name, date and type are required."}), 400

    doc = MedicalDocument(
        patient_id=patient_id,
        name=name,
        date=date,
        doc_type=doc_type,
    )
    
    db.session.add(doc)
    db.session.commit()
    
    return jsonify({"message": "Document added.", "document": doc.to_dict()}), 201


# ---- PRESCRIPTIONS ----
@medical_bp.route("/patients/<int:patient_id>/prescriptions", methods=["GET", "POST"])
def prescriptions_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    if request.method == "GET":
        prescs = Prescription.query.filter_by(patient_id=patient_id).all()
        return jsonify([p.to_dict() for p in prescs]), 200

    data = request.get_json() or {}
    medication = data.get("medication")
    dosage = data.get("dosage")
    frequency = data.get("frequency")
    date_issued = data.get("date_issued")
    prescribing_dentist = data.get("prescribing_dentist")

    if not all([medication, dosage, frequency, date_issued, prescribing_dentist]):
        return jsonify({
            "error": "medication, dosage, frequency, date_issued and prescribing_dentist are required."
        }), 400

    presc = Prescription(
        patient_id=patient_id,
        medication=medication,
        dosage=dosage,
        frequency=frequency,
        date_issued=date_issued,
        prescribing_dentist=prescribing_dentist,
    )
    
    db.session.add(presc)
    db.session.commit()
    
    return jsonify({"message": "Prescription added.", "prescription": presc.to_dict()}), 201


@medical_bp.route("/prescriptions/<int:prescription_id>", methods=["PUT"])
def update_prescription(prescription_id):
    presc = Prescription.query.get(prescription_id)
    if not presc:
        return jsonify({"error": "Prescription not found."}), 404

    data = request.get_json() or {}
    presc.medication = data.get("medication", presc.medication)
    presc.dosage = data.get("dosage", presc.dosage)
    presc.frequency = data.get("frequency", presc.frequency)
    presc.date_issued = data.get("date_issued", presc.date_issued)
    presc.prescribing_dentist = data.get("prescribing_dentist", presc.prescribing_dentist)

    db.session.commit()
    
    return jsonify({"message": "Prescription updated.", "prescription": presc.to_dict()}), 200


# ---- TREATMENT PLANS ----
@medical_bp.route("/patients/<int:patient_id>/treatments", methods=["GET", "POST"])
def treatments_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    if request.method == "GET":
        items = TreatmentPlan.query.filter_by(patient_id=patient_id).all()
        return jsonify([t.to_dict() for t in items]), 200

    data = request.get_json() or {}
    procedure = data.get("procedure")
    tooth = data.get("tooth")
    date = data.get("date")
    cost = data.get("cost")
    status = data.get("status")

    if not all([procedure, date, cost, status]):
        return jsonify({"error": "procedure, date, cost and status are required."}), 400
    
    if status not in ("Proposed", "Completed"):
        return jsonify({"error": "status must be Proposed or Completed."}), 400

    t = TreatmentPlan(
        patient_id=patient_id,
        procedure=procedure,
        tooth=tooth,
        date=date,
        cost=cost,
        status=status,
    )
    
    db.session.add(t)
    db.session.commit()
    
    return jsonify({"message": "Treatment added.", "treatment": t.to_dict()}), 201


@medical_bp.route("/treatments/<int:treatment_id>", methods=["PUT"])
def update_treatment(treatment_id):
    t = TreatmentPlan.query.get(treatment_id)
    if not t:
        return jsonify({"error": "Treatment not found."}), 404

    data = request.get_json() or {}
    t.procedure = data.get("procedure", t.procedure)
    t.tooth = data.get("tooth", t.tooth)
    t.date = data.get("date", t.date)
    t.cost = data.get("cost", t.cost)
    
    new_status = data.get("status", t.status)
    if new_status in ("Proposed", "Completed"):
        t.status = new_status

    db.session.commit()
    
    return jsonify({"message": "Treatment updated.", "treatment": t.to_dict()}), 200