import os
from datetime import datetime

from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename

from backend.routes import bp
from backend.models import (
    db,
    Patient,
    MedicalRecord,
    Prescription,
    TreatmentPlan,
    allowed_file,
    load_json_field,
    dumps_field,
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


# ---- MEDICAL RECORDS ----
@bp.route("/api/patients/<int:patient_id>/medical-record", methods=["GET"])
def get_medical_record(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()

    if record is None:
        record = MedicalRecord(
            patient_id=patient_id,
            past_diagnoses="",
            allergies="",
            medications="",
            documents=dumps_field([]),
        )
        db.session.add(record)
        db.session.commit()

    record_data = record.to_dict()
    docs_data = load_json_field(record.documents)
    
    return jsonify({
        "patient": patient.to_dict(),
        "medical_history": record_data,
        "documents": docs_data,
    }), 200


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
    return jsonify({
        "message": "Medical history saved.",
        "medical_history": record.to_dict()
    }), 200


@bp.route("/api/patients/<int:patient_id>/documents", methods=["GET", "POST"])
def documents_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
    if not record:
        record = MedicalRecord(
            patient_id=patient_id,
            documents=dumps_field([])
        )
        db.session.add(record)
        db.session.commit()

    # ---------- GET ----------
    if request.method == "GET":
        return jsonify(load_json_field(record.documents)), 200

    # ---------- POST (FILE UPLOAD) ----------
    print("📤 Received upload request")
    print(f"Form data: {request.form}")
    print(f"Files: {request.files}")
    
    name = request.form.get("name")
    doc_type = request.form.get("type")
    file = request.files.get("file")

    if not name or not doc_type or not file:
        return jsonify({
            "error": "name, type and file are required",
            "received": {
                "name": name,
                "type": doc_type,
                "file": file is not None
            }
        }), 400

    if not allowed_file(file.filename, doc_type):
        return jsonify({"error": f"Invalid file type. Expected {doc_type}"}), 400

    # Generate unique filename
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    safe_filename = secure_filename(file.filename)
    filename = f"{timestamp}_{safe_filename}"
    
    # Save to filesystem
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)  # Ensure folder exists
    
    file_path = os.path.join(upload_folder, filename)
    
    print(f"💾 Saving file to: {file_path}")
    file.save(file_path)
    
    # Verify file was saved
    if os.path.exists(file_path):
        file_size = os.path.getsize(file_path)
        print(f"✅ File saved successfully! Size: {file_size} bytes")
    else:
        print(f"❌ File was NOT saved!")
        return jsonify({"error": "Failed to save file to filesystem"}), 500

    # Create metadata
    doc_data = {
        "id": filename,
        "name": name,
        "type": doc_type,
        "url": f"/uploads/{filename}",
    }

    # Update database
    docs = load_json_field(record.documents)
    docs.append(doc_data)
    record.documents = dumps_field(docs)
    db.session.commit()
    
    print(f"✅ Document metadata saved to database")
    print(f"📄 Document data: {doc_data}")

    return jsonify(doc_data), 201


@bp.route("/api/patients/<int:patient_id>/documents/<doc_id>", methods=["DELETE"])
def delete_patient_document(patient_id, doc_id):
    record = MedicalRecord.query.filter_by(patient_id=patient_id).first_or_404()

    docs = load_json_field(record.documents)
    docs = [d for d in docs if d["id"] != doc_id]
    record.documents = dumps_field(docs)

    file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], doc_id)
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"🗑️ Deleted file: {file_path}")

    db.session.commit()
    return jsonify({"message": "deleted"}), 200


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
    return jsonify({
        "message": "Prescription added.",
        "prescription": presc.to_dict()
    }), 201


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
    presc.prescribing_dentist = data.get("prescribing_dentist", presc.prescribing_dentist)

    db.session.commit()
    return jsonify({
        "message": "Prescription updated.",
        "prescription": presc.to_dict()
    }), 200


@bp.route("/api/prescriptions/<int:prescription_id>", methods=["DELETE"])
def delete_prescription(prescription_id):
    presc = Prescription.query.get(prescription_id)
    if not presc:
        return jsonify({"error": "Prescription not found."}), 404

    db.session.delete(presc)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


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

    if not all([procedure, date, cost, status]):
        return jsonify({
            "error": "procedure, date, cost and status are required."
        }), 400
    
    if status not in ("Proposed", "Completed"):
        return jsonify({
            "error": "status must be Proposed or Completed."
        }), 400

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
    return jsonify({
        "message": "Treatment added.",
        "treatment": t.to_dict()
    }), 201


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
    return jsonify({
        "message": "Treatment updated.",
        "treatment": t.to_dict()
    }), 200

@bp.route("/api/treatments/<int:treatment_id>", methods=["DELETE"])
def delete_treatment(treatment_id):
    t = TreatmentPlan.query.get(treatment_id)
    if not t:
        return jsonify({"error": "Treatment not found"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200
