# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Role, Staff

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dentist.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(
    app,
    origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    supports_credentials=True,
)

# ---------- DB INIT & ROLE SEEDING ----------

def init_db_and_seed():
    with app.app_context():
        db.create_all()

        if Role.query.count() == 0:
            roles = ["Dentist", "Receptionist", "Manager"]
            for name in roles:
                db.session.add(Role(name=name))
            db.session.commit()
            print("Seeded roles:", roles)


init_db_and_seed()

# ---------- ROLES ----------

@app.route("/api/roles", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles])

# ---------- STAFF CRUD ----------

@app.route("/api/staff", methods=["GET"])
def list_staff():
    staff = Staff.query.all()
    return jsonify([s.to_dict() for s in staff])


@app.route("/api/staff", methods=["POST"])
def create_staff():
    data = request.get_json() or {}

    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400

    allowed_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "username",
        "role_id",
        "permissions",
        "availability",
        "days_available",
        "hours",
    ]
    kwargs = {key: data.get(key) for key in allowed_fields}

    try:
        staff = Staff(
            **kwargs,
            password_hash=generate_password_hash(password),
        )
        db.session.add(staff)
        db.session.commit()
        return jsonify(staff.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print("Error creating staff:", e)
        return jsonify({"error": "Failed to create staff"}), 500


@app.route("/api/staff/<int:staff_id>", methods=["GET"])
def get_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    return jsonify(staff.to_dict())


@app.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    # optional password change
    new_password = data.pop("password", None)

    allowed_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "username",
        "role_id",
        "permissions",
        "availability",
        "days_available",
        "hours",
    ]

    for key in allowed_fields:
        if key in data:
            setattr(staff, key, data[key])

    if new_password:
        staff.password_hash = generate_password_hash(new_password)

    try:
        db.session.commit()
        return jsonify(staff.to_dict())
    except Exception as e:
        db.session.rollback()
        print("Error updating staff:", e)
        return jsonify({"error": "Failed to update staff"}), 500


@app.route("/api/staff/<int:staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    staff = Staff.query.get_or_404(staff_id)
    try:
        db.session.delete(staff)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        print("Error deleting staff:", e)
        return jsonify({"error": "Failed to delete staff"}), 500

# ---------- LOGIN (USERNAME + PASSWORD) ----------

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required."
        }), 400

    staff = Staff.query.filter_by(username=username).first()

    # compare with password_hash
    if not staff or not check_password_hash(staff.password_hash, password):
        return jsonify({
            "success": False,
            "message": "Invalid username or password."
        }), 401

    return jsonify({
        "success": True,
        "staff_id": staff.id,
        "username": staff.username,
        "role": staff.role.name if staff.role else None,
    }), 200

# ---------- RESET PASSWORD BY EMAIL (FORGOT PASSWORD PAGE) ----------

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    """
    Simple email-based reset:
    body: { "email": "...", "new_password": "..." }
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    new_password = data.get("new_password") or ""

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    staff = Staff.query.filter_by(email=email).first()
    if not staff:
        # don't leak which emails exist
        return jsonify({"message": "If the email exists, the password was updated."}), 200

    staff.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated."}), 200


if __name__ == "__main__":
    app.run(debug=True)
