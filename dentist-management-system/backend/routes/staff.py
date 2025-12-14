from flask import request, jsonify
from werkzeug.security import generate_password_hash

from backend.routes import bp
from backend.models import db, Staff, Role, dumps_field



# ---------- ROUTES ----------

@bp.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ---- ROLES ----
@bp.route("/api/roles", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles])


# ---- STAFF CRUD ----
@bp.route("/api/staff", methods=["GET"])
def list_staff():
    staff = Staff.query.all()
    return jsonify([s.to_dict() for s in staff])


@bp.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}

    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400

    staff = Staff(
        full_name=data.get("full_name"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        username=data.get("username"),
        role_id=data.get("role_id"),
        availability=data.get("availability"),
        days_available=data.get("days_available"),
        hours=data.get("hours"),
        permissions=dumps_field(data.get("permissions")),
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
    return jsonify(s.to_dict())


@bp.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    new_password = data.get("password")
    if new_password:
        s.password_hash = generate_password_hash(new_password)

    for field in (
        "full_name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "username",
        "role_id",
        "availability",
        "days_available",
        "hours",
    ):
        if field in data:
            setattr(s, field, data[field])

    if "permissions" in data:
        s.permissions = dumps_field(data.get("permissions"))

    try:
        db.session.commit()
        return jsonify(s.to_dict())
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
        return jsonify([])

    dentists = Staff.query.filter_by(role_id=dentist_role.id).all()

    result = []
    for d in dentists:
        full_name = d.full_name or f"{d.first_name or ''} {d.last_name or ''}".strip()
        result.append({"id": d.id, "name": full_name})
    return jsonify(result)


