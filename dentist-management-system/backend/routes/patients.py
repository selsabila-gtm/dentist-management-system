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

# ---- PATIENTS ----
@bp.route("/api/patients", methods=["GET"])
def get_patients():
    rows = Patient.query.all()
    result = [
        {
            "id": p.id,
            "name": p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip(),
        }
        for p in rows
    ]
    return jsonify(result)


@bp.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json() or {}
    if not data.get("full_name") and not (
        data.get("first_name") and data.get("last_name")
    ):
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


@bp.route("/api/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    p = Patient.query.get_or_404(patient_id)
    return jsonify(p.to_dict())


# ---- MEDICAL RECORDS, DOCUMENTS, PRESCRIPTIONS, TREATMENTS ----
@bp.route("/api/patients/<int:patient_id>/medical-record", methods=["GET"])
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
    return (
        jsonify(
            {
                "patient": patient.to_dict(),
                "medical_history": record_data,
                "documents": docs_data,
            }
        ),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/medical-history", methods=["PUT"])
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
    return (
        jsonify(
            {"message": "Medical history saved.", "medical_history": record.to_dict()}
        ),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/documents", methods=["GET", "POST"])
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
    return (
        jsonify({"message": "Document added.", "document": doc.to_dict()}),
        201,
    )


@bp.route("/api/patients/<int:patient_id>/prescriptions", methods=["GET", "POST"])
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

    if (
        not medication
        or not dosage
        or not frequency
        or not date_issued
        or not prescribing_dentist
    ):
        return (
            jsonify(
                {
                    "error": "medication, dosage, frequency, date_issued and prescribing_dentist are required."
                }
            ),
            400,
        )

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
    return (
        jsonify({"message": "Prescription added.", "prescription": presc.to_dict()}),
        201,
    )


@bp.route("/api/prescriptions/<int:prescription_id>", methods=["PUT"])
def update_prescription(prescription_id):
    presc = Prescription.query.get(prescription_id)
    if not presc:
        return jsonify({"error": "Prescription not found."}), 404

    data = request.get_json() or {}
    presc.medication = data.get("medication", presc.medication)
    presc.dosage = data.get("dosage", presc.dosage)
    presc.frequency = data.get("frequency", presc.frequency)
    presc.date_issued = data.get("date_issued", presc.date_issued)
    presc.prescribing_dentist = data.get(
        "prescribing_dentist", presc.prescribing_dentist
    )

    db.session.commit()
    return (
        jsonify({"message": "Prescription updated.", "prescription": presc.to_dict()}),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/treatments", methods=["GET", "POST"])
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

    if not procedure or not date or not cost or not status:
        return (
            jsonify({"error": "procedure, date, cost and status are required."}),
            400,
        )
    if status not in ("Proposed", "Completed"):
        return (
            jsonify({"error": "status must be Proposed or Completed."}),
            400,
        )

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
    return (
        jsonify({"message": "Treatment added.", "treatment": t.to_dict()}),
        201,
    )


@bp.route("/api/treatments/<int:treatment_id>", methods=["PUT"])
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
    if new_status not in ("Proposed", "Completed"):
        new_status = t.status
    t.status = new_status

    db.session.commit()
    return (
        jsonify({"message": "Treatment updated.", "treatment": t.to_dict()}),
        200,
    )


