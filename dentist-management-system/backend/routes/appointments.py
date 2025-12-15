import os
import json
from datetime import datetime
from flask import request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename

from backend.routes import bp
from backend.models import Staff
from backend.models import (
    db,
    Appointment,
    Summary,
    allowed_file,
    load_json_field,
    dumps_field,
)

# ---- APPOINTMENTS ----
@bp.route("/api/appointments", methods=["GET"])
def list_appointments():
    appts = Appointment.query.order_by(Appointment.date, Appointment.time).all()
    return jsonify([a.to_dict() for a in appts])


@bp.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    required = ["patient", "date", "time", "dentist", "procedure"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    # optional cost for appointment
    cost = data.get("cost")
    try:
        cost_value = float(cost) if cost is not None and cost != "" else 0.0
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid cost value"}), 400

    # ✅ IMPORTANT FIX:
    # Always set dentist_id if possible (needed for filtering in Reports.jsx)
    dentist_id = data.get("dentist_id")

    # If frontend didn't send dentist_id, try to lookup from Staff by full_name
    if not dentist_id and data.get("dentist"):
        staff = Staff.query.filter_by(full_name=data["dentist"]).first()
        if staff:
            dentist_id = staff.id

    appt = Appointment(
        date=data["date"],
        time=data["time"],
        patient=data["patient"],
        patient_id=data.get("patient_id"),
        dentist=data["dentist"],
        dentist_id=dentist_id,  # ✅ use computed dentist_id
        procedure=data["procedure"],
        status="scheduled",
        cost=cost_value,
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify({"message": "created", "appointment": appt.to_dict()}), 201


@bp.route("/api/appointments/<int:appt_id>/status", methods=["PUT"])
def update_appointment_status(appt_id):
    data = request.json or {}
    new = data.get("status")
    if new not in ("scheduled", "completed", "cancelled"):
        return jsonify({"error": "invalid"}), 400
    a = Appointment.query.get(appt_id)
    if not a:
        return jsonify({"error": "not_found"}), 404
    if a.status in ("completed", "cancelled") and new != a.status:
        return jsonify({"error": "locked"}), 400
    a.status = new
    db.session.commit()
    return jsonify(a.to_dict())


# ✅ ONE-TIME FIX ENDPOINT (for old appointments that already exist in DB)
# Call once after you paste this file:
# POST http://localhost:5000/api/appointments/backfill-dentist-ids
@bp.route("/api/appointments/backfill-dentist-ids", methods=["GET", "POST"])
def backfill_dentist_ids():
    appts = Appointment.query.filter(Appointment.dentist_id.is_(None)).all()
    fixed = 0

    for a in appts:
        if not a.dentist:
            continue
        staff = Staff.query.filter_by(full_name=a.dentist).first()
        if staff:
            a.dentist_id = staff.id
            fixed += 1

    db.session.commit()
    return jsonify({"message": "done", "updated": fixed}), 200


# ---- SUMMARIES ----
@bp.route("/api/appointments/<int:appt_id>/summary", methods=["GET"])
def get_summary(appt_id):
    a = Appointment.query.get(appt_id)
    if not a or not a.summary:
        return jsonify(
            {"notes": "", "prescriptions": [], "documents": [], "inventory": []}
        )
    return jsonify(a.summary.to_dict())


@bp.route("/api/appointments/<int:appt_id>/summary", methods=["POST"])
def save_summary(appt_id):
    data = request.json or {}
    a = Appointment.query.get(appt_id)
    if not a:
        return jsonify({"error": "not_found"}), 404
    if not a.summary:
        a.summary = Summary()
    a.summary.notes = data.get("notes", "")
    a.summary.prescriptions = dumps_field(data.get("prescriptions", []))
    a.summary.documents = dumps_field(data.get("documents", []))
    a.summary.inventory = dumps_field(data.get("inventory", []))
    a.status = "completed"
    db.session.commit()
    return jsonify({"message": "saved"})


# ---- DOCUMENT UPLOAD & SERVE ----
@bp.route("/api/appointments/<int:appt_id>/documents", methods=["POST"])
def upload_document(appt_id):
    doc_name = request.form.get("name")
    doc_type = request.form.get("type")
    file = request.files.get("file")

    if not doc_name or not doc_type or not file:
        return jsonify({"error": "missing_fields"}), 400
    if doc_type not in ("pdf", "img"):
        return jsonify({"error": "invalid_type"}), 400
    if not allowed_file(file.filename, doc_type):
        return jsonify({"error": "invalid_extension"}), 400

    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{secure_filename(file.filename)}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)
    file_url = f"/uploads/{filename}"

    a = Appointment.query.get(appt_id)
    if not a:
        return jsonify({"error": "not_found"}), 404
    if not a.summary:
        a.summary = Summary()

    docs = load_json_field(a.summary.documents)
    docs.append({"name": doc_name, "type": doc_type, "url": file_url})
    a.summary.documents = json.dumps(docs)
    db.session.commit()
    return jsonify({"documents": docs})


@bp.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
