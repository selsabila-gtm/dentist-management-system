# backend/app.py
import os
import json
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, current_app
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# ---------- CONFIG ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
os.makedirs(INSTANCE_DIR, exist_ok=True)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.path.join(INSTANCE_DIR, "dentist.db")
SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"

ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "gif"}
ALLOWED_PDF_EXT = {"pdf"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# ---------- APP & DB ----------
app = Flask(__name__, instance_relative_config=True)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True,
)

db = SQLAlchemy(app)

# ---------- HELPERS ----------
def allowed_file(filename, doc_type):
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    if doc_type == "pdf":
        return ext in ALLOWED_PDF_EXT
    if doc_type == "img":
        return ext in ALLOWED_IMAGE_EXT
    return False

def load_json_field(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception:
        return []

def dumps_field(value):
    try:
        return json.dumps(value or [])
    except Exception:
        return "[]"

# ---------- MODELS ----------
class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class Staff(db.Model):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)

    # basic identity
    full_name = db.Column(db.String(200))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))

    # contact
    email = db.Column(db.String(150), unique=True)
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))

    # auth
    username = db.Column(db.String(80), unique=True)
    password_hash = db.Column(db.String(200))

    # role
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=True)
    role = db.relationship("Role", backref="staff_members")

    # permissions & schedule (for staff feature)
    permissions = db.Column(db.Text)  # JSON string
    availability = db.Column(db.String(50))
    days_available = db.Column(db.String(100))
    hours = db.Column(db.String(100))

    def to_dict(self):
        full_name = self.full_name or f"{self.first_name or ''} {self.last_name or ''}".strip()
        return {
            "id": self.id,
            # name fields
            "name": full_name,          # for old frontend
            "full_name": full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,

            # contact
            "email": self.email,
            "phone": self.phone,
            "address": self.address,

            # auth
            "username": self.username,

            # schedule fields used in table
            "availability": self.availability,
            "days_available": self.days_available,
            "hours": self.hours,

            # permissions object for checkboxes
            "permissions": load_json_field(self.permissions),

            # role
            "role": self.role.to_dict() if self.role else None,
            "role_name": self.role.name if self.role else None,
        }

class Patient(db.Model):
    __tablename__ = "patients"
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.String(20))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(150))

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name or f"{self.first_name or ''} {self.last_name or ''}".strip(),
            "date_of_birth": self.date_of_birth,
            "phone": self.phone,
            "email": self.email,
        }

class Appointment(db.Model):
    __tablename__ = "appointments"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20))
    time = db.Column(db.String(20))
    patient = db.Column(db.String(100))  # storing patient name for quick UI use
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=True)
    dentist = db.Column(db.String(100))
    dentist_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=True)
    procedure = db.Column(db.String(200))
    status = db.Column(db.String(20), default="scheduled")

    summary = db.relationship("Summary", back_populates="appointment", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "time": self.time,
            "patient": self.patient,
            "patient_id": self.patient_id,
            "dentist": self.dentist,
            "dentist_id": self.dentist_id,
            "procedure": self.procedure,
            "status": self.status,
        }

class Summary(db.Model):
    __tablename__ = "summaries"
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))
    notes = db.Column(db.Text)
    prescriptions = db.Column(db.Text)  # JSON list
    documents = db.Column(db.Text)      # JSON list of docs
    inventory = db.Column(db.Text)      # JSON list

    appointment = db.relationship("Appointment", back_populates="summary")

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "notes": self.notes,
            "prescriptions": load_json_field(self.prescriptions),
            "documents": load_json_field(self.documents),
            "inventory": load_json_field(self.inventory),
        }

class MedicalRecord(db.Model):
    __tablename__ = "medical_records"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"))
    past_diagnoses = db.Column(db.Text)
    allergies = db.Column(db.Text)
    medications = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "past_diagnoses": self.past_diagnoses,
            "allergies": self.allergies,
            "medications": self.medications,
        }

class MedicalDocument(db.Model):
    __tablename__ = "medical_documents"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"))
    name = db.Column(db.String(200))
    date = db.Column(db.String(20))
    doc_type = db.Column(db.String(100))
    file_path = db.Column(db.String(300), nullable=True)  # optional path to uploaded file

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "date": self.date,
            "doc_type": self.doc_type,
            "file_path": self.file_path,
        }

class Prescription(db.Model):
    __tablename__ = "prescriptions"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"))
    medication = db.Column(db.String(200))
    dosage = db.Column(db.String(100))
    frequency = db.Column(db.String(100))
    date_issued = db.Column(db.String(20))
    prescribing_dentist = db.Column(db.String(150))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "medication": self.medication,
            "dosage": self.dosage,
            "frequency": self.frequency,
            "date_issued": self.date_issued,
            "prescribing_dentist": self.prescribing_dentist,
        }

class TreatmentPlan(db.Model):
    __tablename__ = "treatment_plans"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"))
    procedure = db.Column(db.String(200))
    tooth = db.Column(db.String(100))
    date = db.Column(db.String(20))
    cost = db.Column(db.String(50))
    status = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "procedure": self.procedure,
            "tooth": self.tooth,
            "date": self.date,
            "cost": self.cost,
            "status": self.status,
        }

# ---------- DB INIT & SEED ----------
def seed_initial_data():
    # Called with app context
    if Role.query.count() == 0:
        roles = [Role(name="Admin"), Role(name="Dentist"), Role(name="Receptionist"), Role(name="Manager")]
        db.session.add_all(roles)
        db.session.commit()

    if Staff.query.count() == 0:
        dentist_role = Role.query.filter_by(name="Dentist").first()
        admin_role = Role.query.filter_by(name="Admin").first()
        staff_items = [
            Staff(full_name="Dr. Sarah Miller", email="sarah@example.com", username="sarah", password_hash=generate_password_hash("password123"), role_id=dentist_role.id if dentist_role else None),
            Staff(full_name="Dr. David Lee", email="david@example.com", username="david", password_hash=generate_password_hash("password123"), role_id=dentist_role.id if dentist_role else None),
            Staff(full_name="Emma Lopez", email="emma@example.com", username="emma", password_hash=generate_password_hash("password123"), role_id=admin_role.id if admin_role else None),
        ]
        db.session.add_all(staff_items)
        db.session.commit()

    if Patient.query.count() == 0:
        p = Patient(full_name="John Doe", date_of_birth="1990-05-10", phone="+1 555-1234", email="john.doe@example.com")
        p2 = Patient(full_name="Sophia Clark", first_name="Sophia", last_name="Clark", phone="555-0101", email="sophia.clark@example.com")
        p3 = Patient(full_name="Ethan Harper", first_name="Ethan", last_name="Harper", phone="555-0102", email="ethan.harper@example.com")
        db.session.add_all([p, p2, p3])
        db.session.commit()

    if Appointment.query.count() == 0:
        appts = [
            Appointment(date="2025-11-26", time="09:00 AM", patient="Sophia Clark", patient_id=Patient.query.filter_by(first_name="Sophia").first().id if Patient.query.filter_by(first_name="Sophia").first() else None, dentist="Dr. Sarah Miller", procedure="Routine Checkup", status="scheduled"),
            Appointment(date="2025-11-26", time="10:30 AM", patient="Ethan Harper", patient_id=Patient.query.filter_by(first_name="Ethan").first().id if Patient.query.filter_by(first_name="Ethan").first() else None, dentist="Dr. David Lee", procedure="Teeth Cleaning", status="scheduled"),
        ]
        db.session.add_all(appts)
        db.session.commit()

    # demo medical record, prescriptions, treatment plans
    john = Patient.query.filter_by(full_name="John Doe").first()
    if john and MedicalRecord.query.filter_by(patient_id=john.id).count() == 0:
        record = MedicalRecord(patient_id=john.id, past_diagnoses="History of cavities", allergies="Penicillin", medications="Ibuprofen")
        db.session.add(record)
    if john and Prescription.query.filter_by(patient_id=john.id).count() == 0:
        presc = Prescription(patient_id=john.id, medication="Amoxicillin", dosage="500mg", frequency="Three times a day", date_issued="2024-01-15", prescribing_dentist="Dr. Sarah Miller")
        db.session.add(presc)
    if john and TreatmentPlan.query.filter_by(patient_id=john.id).count() == 0:
        t = TreatmentPlan(patient_id=john.id, procedure="Filling", tooth="Tooth #3", date="2023-08-29", cost="150", status="Completed")
        db.session.add(t)
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_initial_data()

# ---------- ROUTES ----------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

# ---- ROLES ----
@app.route("/api/roles", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles])

# ---- STAFF CRUD ----
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

    # build staff object from request
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

@app.route("/api/staff/<int:staff_id>", methods=["GET"])
def get_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    return jsonify(s.to_dict())

@app.route("/api/staff/<int:staff_id>", methods=["PUT"])
def update_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    data = request.get_json() or {}

    # optional password change
    new_password = data.get("password")
    if new_password:
        s.password_hash = generate_password_hash(new_password)

    # simple fields
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

    # permissions needs JSON dump
    if "permissions" in data:
        s.permissions = dumps_field(data.get("permissions"))

    try:
        db.session.commit()
        return jsonify(s.to_dict())
    except Exception as e:
        db.session.rollback()
        print("Error updating staff:", e)
        return jsonify({"error": "Failed to update staff", "detail": str(e)}), 500

@app.route("/api/staff/<int:staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    s = Staff.query.get_or_404(staff_id)
    try:
        db.session.delete(s)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete staff", "detail": str(e)}), 500

@app.route("/api/staff/dentists", methods=["GET"])
def get_dentists():
    """
    Return ONLY staff whose role is 'Dentist'.
    Used by the Add Appointment page to populate the dentist dropdown.
    """
    dentist_role = Role.query.filter_by(name="Dentist").first()
    if not dentist_role:
        return jsonify([])

    dentists = Staff.query.filter_by(role_id=dentist_role.id).all()

    result = []
    for d in dentists:
        full_name = d.full_name or f"{d.first_name or ''} {d.last_name or ''}".strip()
        result.append({
            "id": d.id,
            "name": full_name,
        })

    return jsonify(result)

# ---- AUTH ----
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400
    staff = Staff.query.filter((Staff.username == username) | (Staff.email == username)).first()
    if not staff or not check_password_hash(staff.password_hash, password):
        return jsonify({"success": False, "message": "Invalid username or password."}), 401
    return jsonify({"success": True, "staff_id": staff.id, "username": staff.username, "role": staff.role.name if staff.role else None}), 200

@app.route("/api/reset-password", methods=["POST"])
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
        # don't leak existence
        return jsonify({"message": "If the email exists, the password was updated."}), 200
    staff.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated."}), 200

# ---- PATIENTS ----
@app.route("/api/patients", methods=["GET"])
def get_patients():
    rows = Patient.query.all()
    result = [{"id": p.id, "name": p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip()} for p in rows]
    return jsonify(result)

@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json() or {}
    if not data.get("full_name") and not (data.get("first_name") and data.get("last_name")):
        return jsonify({"error": "Patient name is required"}), 400
    p = Patient(
        full_name=data.get("full_name"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        date_of_birth=data.get("date_of_birth"),
        phone=data.get("phone"),
        email=data.get("email"),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201

@app.route("/api/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    p = Patient.query.get_or_404(patient_id)
    return jsonify(p.to_dict())

# ---- APPOINTMENTS ----
@app.route("/api/appointments", methods=["GET"])
def list_appointments():
    appts = Appointment.query.order_by(Appointment.date, Appointment.time).all()
    return jsonify([a.to_dict() for a in appts])

@app.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    required = ["patient", "date", "time", "dentist", "procedure"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    appt = Appointment(
        date=data["date"],
        time=data["time"],
        patient=data["patient"],
        patient_id=data.get("patient_id"),
        dentist=data["dentist"],
        dentist_id=data.get("dentist_id"),
        procedure=data["procedure"],
        status="scheduled",
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify({"message": "created", "appointment": appt.to_dict()}), 201

@app.route("/api/appointments/<int:appt_id>/status", methods=["PUT"])
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

# ---- SUMMARIES ----
@app.route("/api/appointments/<int:appt_id>/summary", methods=["GET"])
def get_summary(appt_id):
    a = Appointment.query.get(appt_id)
    if not a or not a.summary:
        return jsonify({"notes": "", "prescriptions": [], "documents": [], "inventory": []})
    return jsonify(a.summary.to_dict())

@app.route("/api/appointments/<int:appt_id>/summary", methods=["POST"])
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
@app.route("/api/appointments/<int:appt_id>/documents", methods=["POST"])
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

@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

# ---- MEDICAL RECORDS, DOCUMENTS, PRESCRIPTIONS, TREATMENTS ----
@app.route("/api/patients/<int:patient_id>/medical-record", methods=["GET"])
def get_medical_record(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
    documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
    if record is None:
        record_data = {"patient_id": patient_id, "past_diagnoses": "", "allergies": "", "medications": ""}
    else:
        record_data = record.to_dict()
    docs_data = [doc.to_dict() for doc in documents]
    return jsonify({"patient": patient.to_dict(), "medical_history": record_data, "documents": docs_data}), 200

@app.route("/api/patients/<int:patient_id>/medical-history", methods=["PUT"])
def update_medical_history(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    data = request.get_json() or {}
    past = data.get("past_diagnoses", "")
    allergies = data.get("allergies", "")
    meds = data.get("medications", "")
    record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
    if record is None:
        record = MedicalRecord(patient_id=patient_id, past_diagnoses=past, allergies=allergies, medications=meds)
        db.session.add(record)
    else:
        record.past_diagnoses = past
        record.allergies = allergies
        record.medications = meds
    db.session.commit()
    return jsonify({"message": "Medical history saved.", "medical_history": record.to_dict()}), 200

@app.route("/api/patients/<int:patient_id>/documents", methods=["GET", "POST"])
def documents_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    if request.method == "GET":
        documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
        return jsonify([d.to_dict() for d in documents]), 200
    data = request.get_json() or {}
    name = data.get("name"); date = data.get("date"); doc_type = data.get("type")
    if not name or not date or not doc_type:
        return jsonify({"error": "name, date and type are required."}), 400
    doc = MedicalDocument(patient_id=patient_id, name=name, date=date, doc_type=doc_type)
    db.session.add(doc)
    db.session.commit()
    return jsonify({"message": "Document added.", "document": doc.to_dict()}), 201

@app.route("/api/patients/<int:patient_id>/prescriptions", methods=["GET", "POST"])
def prescriptions_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    if request.method == "GET":
        prescs = Prescription.query.filter_by(patient_id=patient_id).all()
        return jsonify([p.to_dict() for p in prescs]), 200
    data = request.get_json() or {}
    medication = data.get("medication"); dosage = data.get("dosage"); frequency = data.get("frequency")
    date_issued = data.get("date_issued"); prescribing_dentist = data.get("prescribing_dentist")
    if not medication or not dosage or not frequency or not date_issued or not prescribing_dentist:
        return jsonify({"error": "medication, dosage, frequency, date_issued and prescribing_dentist are required."}), 400
    presc = Prescription(patient_id=patient_id, medication=medication, dosage=dosage, frequency=frequency, date_issued=date_issued, prescribing_dentist=prescribing_dentist)
    db.session.add(presc)
    db.session.commit()
    return jsonify({"message": "Prescription added.", "prescription": presc.to_dict()}), 201

@app.route("/api/prescriptions/<int:prescription_id>", methods=["PUT"])
def update_prescription(prescription_id):
    presc = Prescription.query.get(prescription_id)
    if not presc:
        return jsonify({"error": "Prescription not found."}), 404
    data = request.get_json() or {}
    presc.medication = data.get("medication", presc.medication)
    presc.dosage = data.get("dosage", presc.dosage)
    presc.frequency = data.get("frequency", presc.frequency)
    presc.date_issued = data.get("date_issued", presc.date_issued)
    presc.prescribing_dentist = data.get("prescribing_dentist", presc.prescribing_dentist)
    db.session.commit()
    return jsonify({"message": "Prescription updated.", "prescription": presc.to_dict()}), 200

@app.route("/api/patients/<int:patient_id>/treatments", methods=["GET", "POST"])
def treatments_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404
    if request.method == "GET":
        items = TreatmentPlan.query.filter_by(patient_id=patient_id).all()
        return jsonify([t.to_dict() for t in items]), 200
    data = request.get_json() or {}
    procedure = data.get("procedure"); tooth = data.get("tooth"); date = data.get("date"); cost = data.get("cost"); status = data.get("status")
    if not procedure or not date or not cost or not status:
        return jsonify({"error": "procedure, date, cost and status are required."}), 400
    if status not in ("Proposed", "Completed"):
        return jsonify({"error": "status must be Proposed or Completed."}), 400
    t = TreatmentPlan(patient_id=patient_id, procedure=procedure, tooth=tooth, date=date, cost=cost, status=status)
    db.session.add(t)
    db.session.commit()
    return jsonify({"message": "Treatment added.", "treatment": t.to_dict()}), 201

@app.route("/api/treatments/<int:treatment_id>", methods=["PUT"])
def update_treatment(treatment_id):
    t = TreatmentPlan.query.get(treatment_id)
    if not t:
        return jsonify({"error": "Treatment not found."}), 404
    data = request.get_json() or {}
    t.procedure = data.get("procedure", t.procedure)
    t.tooth = data.get("tooth", t.tooth)
    t.date = data.get("date", t.date)
    t.cost = data.get("cost", t.cost)
    new_status = data.get("status", t.status)
    if new_status not in ("Proposed", "Completed"):
        new_status = t.status
    t.status = new_status
    db.session.commit()
    return jsonify({"message": "Treatment updated.", "treatment": t.to_dict()}), 200

# ---------- MAIN ----------
if __name__ == "__main__":
    # Run dev server
    app.run(debug=True, host="0.0.0.0", port=5000)
