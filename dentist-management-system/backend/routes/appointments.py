import os
import json
from datetime import datetime
from flask import request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename

from backend.routes import bp
from backend.models import (
    db,
    Appointment,
    Summary,
    allowed_file,
    load_json_field,
    dumps_field,
)


@bp.route("/api/appointments", methods=["GET"])
def list_appointments():
    return jsonify([a.to_dict() for a in Appointment.query.all()])


@bp.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    appt = Appointment(**data, status="scheduled")
    db.session.add(appt)
    db.session.commit()
    return jsonify(appt.to_dict()), 201


@bp.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
