import os, json
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from werkzeug.utils import secure_filename
from backend.models import db, Appointment, Summary, dumps_field, load_json_field, allowed_file

bp = Blueprint("appointments", __name__)

@bp.route("/api/appointments", methods=["GET"])
def list_appointments():
    appts = Appointment.query.order_by(Appointment.date, Appointment.time).all()
    return jsonify([a.to_dict() for a in appts]), 200

@bp.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    required = ["patient", "date", "time", "dentist", "procedure"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    cost = data.get("cost")
    try:
        cost_value = float(cost) if cost is not None and cost != "" else 0.0
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid cost value"}), 400

    appt = Appointment(
        date=data["date"],
        time=data["time"],
        patient=data["patient"],
        patient_id=data.get("patient_id"),
        dentist=data["dentist"],
        dentist_id=data.get("dentist_id"),
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
    return jsonify(a.to_dict()), 200

# Summaries
@bp.route("/api/appointments/<int:appt_id>/summary", methods=["GET", "POST"])
def summary_routes(appt_id):
    if request.method == "GET":
        a = Appointment.query.get(appt_id)
        if not a or not a.summary:
            return jsonify({"notes": "", "prescriptions": [], "documents": [], "inventory": []}), 200
        return jsonify(a.summary.to_dict()), 200

    # POST save summary
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
    return jsonify({"message": "saved"}), 200

# Document upload
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
    return jsonify({"documents": docs}), 200

@bp.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
