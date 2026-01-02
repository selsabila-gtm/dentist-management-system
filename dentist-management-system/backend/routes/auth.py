from flask import request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
import json

from backend.routes import bp
from backend.models import db, Staff


def load_json_dict(value):
    """
    Permissions must be a DICT.
    If DB contains "[]" or invalid JSON, return {} so .get() never crashes.
    """
    if not value:
        return {}
    try:
        obj = json.loads(value)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        return {}


# ---------- AUTH ----------
@bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400

    staff = Staff.query.filter(
        (Staff.username == username) | (Staff.email == username)
    ).first()

    if not staff or not check_password_hash(staff.password_hash, password):
        return jsonify({"success": False, "message": "Invalid username or password."}), 401

    # ✅ permissions must be dict (not [])
    perms = load_json_dict(staff.permissions)
    role_name = staff.role.name if staff.role else None

    user = {
        "id": staff.id,
        "username": staff.username,
        "email": staff.email,
        "role_name": role_name,
        "role": {"name": role_name} if role_name else None,
        "permissions": perms,
        "is_admin": bool(perms.get("is_admin")) or (role_name or "").lower() == "admin",
    }

    return jsonify({
        "success": True,
        "staff_id": staff.id,
        "user": user,
    }), 200


@bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    new_password = data.get("new_password") or ""

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    staff = Staff.query.filter_by(email=email).first()

    if not staff:
        return jsonify({"message": "If the email exists, the password was updated."}), 200

    staff.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated."}), 200
