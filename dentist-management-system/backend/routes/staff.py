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

# Replace the update_staff route in routes.py with this version
@bp.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    # Special handling for password updates
    new_password = data.get("password")
    current_password = data.get("current_password")
    
    if new_password:
        # If trying to update password, MUST provide and verify current password
        if not current_password:
            return jsonify({"error": "Current password is required to change password"}), 400
        
        # Verify current password is correct
        if not check_password_hash(s.password_hash, current_password):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({"error": "New password must be at least 8 characters"}), 400
        
        # Update password
        s.password_hash = generate_password_hash(new_password)
        
        # Don't update any other fields when changing password
        try:
            db.session.commit()
            return jsonify({"message": "Password updated successfully"})
        except Exception as e:
            db.session.rollback()
            print("Error updating password:", e)
            return jsonify({"error": "Failed to update password", "detail": str(e)}), 500

    # Update other fields (only if not a password change request)
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
        "profile_photo",
    ):
        if field in data:
            setattr(s, field, data[field])

    if "permissions" in data:
        s.permissions = dumps_field(data.get("permissions"))
    
    if "notification_preferences" in data:
        # Handle notification_preferences - it might come as a string or dict
        notif_prefs = data.get("notification_preferences")
        if isinstance(notif_prefs, str):
            s.notification_preferences = notif_prefs
        else:
            s.notification_preferences = dumps_field(notif_prefs)

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
