from flask import request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash

from backend.routes import bp
from backend.models import db, Staff


@bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return (
            jsonify(
                {"success": False, "message": "Username and password are required."}
            ),
            400,
        )
    staff = Staff.query.filter(
        (Staff.username == username) | (Staff.email == username)
    ).first()
    if not staff or not check_password_hash(staff.password_hash, password):
        return jsonify(
            {"success": False, "message": "Invalid username or password."}
        ), 401
    return (
        jsonify(
            {
                "success": True,
                "staff_id": staff.id,
                "username": staff.username,
                "role": staff.role.name if staff.role else None,
                "role_id": staff.role.id ,
                "full_name": staff.full_name,
                "email": staff.email,
                "profile_photo": staff.profile_photo,
                # Include the complete user object for easy storage
                "user": staff.to_dict()
            }
        ),
        200,
    )


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

