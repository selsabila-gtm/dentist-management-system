from flask import request, jsonify
from werkzeug.security import generate_password_hash

from backend.routes import bp
from backend.models import db, Staff, Role, dumps_field


@bp.route("/api/roles", methods=["GET"])
def get_roles():
    return jsonify([r.to_dict() for r in Role.query.all()])


@bp.route("/api/staff", methods=["GET"])
def list_staff():
    return jsonify([s.to_dict() for s in Staff.query.all()])


@bp.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}
    password = data.get("password")

    if not password:
        return jsonify({"error": "Password required"}), 400

    staff = Staff(
        full_name=data.get("full_name"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        username=data.get("username"),
        role_id=data.get("role_id"),
        permissions=dumps_field(data.get("permissions")),
        password_hash=generate_password_hash(password),
    )

    db.session.add(staff)
    db.session.commit()
    return jsonify(staff.to_dict()), 201


@bp.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    for field in data:
        if hasattr(staff, field) and field != "password":
            setattr(staff, field, data[field])

    if "password" in data:
        staff.password_hash = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify(staff.to_dict())


@bp.route("/api/staff/<int:staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    db.session.delete(staff)
    db.session.commit()
    return "", 204
