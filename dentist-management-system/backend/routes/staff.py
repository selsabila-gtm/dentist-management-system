# backend/staff.py
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from backend.routes import bp
from backend.models import db, Staff, Role, dumps_field, load_json_field


# ---------- ROLES ----------
@bp.route("/api/roles", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles]), 200


@bp.route("/api/roles", methods=["POST"])
def create_role():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Role name is required"}), 400

    existing = Role.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Role already exists"}), 400

    r = Role(name=name)
    db.session.add(r)
    db.session.commit()
    return jsonify(r.to_dict()), 201


# ---------- STAFF CRUD ----------
@bp.route("/api/staff", methods=["GET"])
def list_staff():
    staff = Staff.query.all()
    return jsonify([s.to_dict() for s in staff]), 200


@bp.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}

    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    role_id = data.get("role_id")
    if not role_id:
        return jsonify({"error": "role_id is required"}), 400

    staff = Staff(
        full_name=data.get("full_name"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        username=data.get("username"),
        role_id=role_id,
        days_available=data.get("days_available"),
        hours=data.get("hours"),
        permissions=dumps_field(data.get("permissions") or {}),
        password_hash=generate_password_hash(password),
    )

    try:
        db.session.add(staff)
        db.session.commit()
        return jsonify(staff.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print("Error creating staff:", e)
        return jsonify({"error": "Failed to create staff", "detail": str(e)}), 500


@bp.route("/api/staff/<int:staff_id>", methods=["GET"])
def get_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    return jsonify(s.to_dict()), 200


@bp.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    # Optional password change
    new_password = data.get("password")
    if new_password:
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        s.password_hash = generate_password_hash(new_password)

    # Update normal fields (REMOVED availability)
    for field in (
        "full_name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "username",
        "role_id",
        "days_available",
        "hours",
        "profile_photo",
    ):
        if field in data:
            setattr(s, field, data[field])

    if "permissions" in data:
        s.permissions = dumps_field(data.get("permissions") or {})

    # optional notification_preferences
    if "notification_preferences" in data:
        s.notification_preferences = dumps_field(data.get("notification_preferences"))

    try:
        db.session.commit()
        return jsonify(s.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating staff:", e)
        return jsonify({"error": "Failed to update staff", "detail": str(e)}), 500

@bp.route("/api/staff/<int:staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    try:
        db.session.delete(s)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete staff", "detail": str(e)}), 500


@bp.route("/api/staff/dentists", methods=["GET"])
def get_dentists():
    dentist_role = Role.query.filter_by(name="Dentist").first()
    if not dentist_role:
        return jsonify([]), 200

    dentists = Staff.query.filter_by(role_id=dentist_role.id).all()

    result = []
    for d in dentists:
        full_name = d.full_name or f"{d.first_name or ''} {d.last_name or ''}".strip()
        result.append({"id": d.id, "name": full_name})
    return jsonify(result), 200


