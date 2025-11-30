import os
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# ---------- FILE UPLOAD CONFIG ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "gif"}
ALLOWED_PDF_EXT = {"pdf"}

def allowed_file(filename, doc_type):
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    if doc_type == "pdf":
        return ext in ALLOWED_PDF_EXT
    if doc_type == "img":
        return ext in ALLOWED_IMAGE_EXT
    return False

# ---------- DB SETUP ----------
engine = create_engine("sqlite:///appointments.db", echo=False)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


# === EXISTING MODELS (UNCHANGED) ===
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20))
    time = Column(String(20))
    patient = Column(String(100))
    dentist = Column(String(100))
    procedure = Column(String(100))
    status = Column(String(20))

    summary = relationship("Summary", back_populates="appointment", uselist=False)


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    notes = Column(Text)
    prescriptions = Column(Text)
    documents = Column(Text)
    inventory = Column(Text)

    appointment = relationship("Appointment", back_populates="summary")


# === ADDED MODELS FOR PATIENTS + STAFF (ONLY ADDITION) ===
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(50))
    email = Column(String(100))


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    role = Column(String(50))


Base.metadata.create_all(bind=engine)

# ---------- SEED: 26 NOV 2025 ----------
def seed_data():
    db = SessionLocal()
    if db.query(Appointment).count() == 0:
        seed = [
            Appointment(
                date="2025-11-26",
                time="09:00 AM",
                patient="Sophia Clark",
                dentist="Dr. Smith",
                procedure="Routine Checkup",
                status="scheduled",
            ),
            Appointment(
                date="2025-11-26",
                time="10:30 AM",
                patient="Ethan Harper",
                dentist="Dr. Adams",
                procedure="Teeth Cleaning",
                status="scheduled",
            ),
            Appointment(
                date="2025-11-26",
                time="01:00 PM",
                patient="Olivia Bennett",
                dentist="Dr. Carter",
                procedure="Filling",
                status="scheduled",
            ),
        ]
        db.add_all(seed)
        db.commit()
    db.close()


seed_data()


# ---------- NEW SEED FOR PATIENTS + STAFF (ONLY IF EMPTY) ----------
def seed_people():
    db = SessionLocal()

    # 3 example patients (only inserted if table empty)
    if db.query(Patient).count() == 0:
        patients = [
            Patient(
                first_name="Sophia",
                last_name="Clark",
                phone="555-0101",
                email="sophia.clark@example.com",
            ),
            Patient(
                first_name="Ethan",
                last_name="Harper",
                phone="555-0102",
                email="ethan.harper@example.com",
            ),
            Patient(
                first_name="Ava",
                last_name="Mitchell",
                phone="555-0103",
                email="ava.mitchell@example.com",
            ),
        ]
        db.add_all(patients)

    # some staff, including dentists
    if db.query(Staff).count() == 0:
        staff = [
            Staff(name="Dr. Smith", role="dentist"),
            Staff(name="Dr. Adams", role="dentist"),
            Staff(name="Dr. Carter", role="dentist"),
            Staff(name="Emma Lopez", role="assistant"),
        ]
        db.add_all(staff)

    db.commit()
    db.close()


seed_people()


def load_json_field(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except:
        return []


def appointment_to_dict(a):
    return {
        "id": a.id,
        "date": a.date,
        "time": a.time,
        "patient": a.patient,
        "dentist": a.dentist,
        "procedure": a.procedure,
        "status": a.status,
    }

# ---------- API ----------
@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    db = SessionLocal()
    appts = db.query(Appointment).order_by(Appointment.time).all()
    db.close()
    return jsonify([appointment_to_dict(a) for a in appts])


@app.route("/api/appointments/<int:id>/status", methods=["PUT"])
def update_status(id):
    data = request.json
    new = data.get("status")

    if new not in ("scheduled", "completed", "cancelled"):
        return jsonify({"error": "invalid"}), 400

    db = SessionLocal()
    a = db.query(Appointment).get(id)

    if not a:
        db.close()
        return jsonify({"error": "not_found"}), 404

    if a.status in ("completed", "cancelled") and new != a.status:
        db.close()
        return jsonify({"error": "locked"}), 400

    a.status = new
    db.commit()
    res = appointment_to_dict(a)
    db.close()
    return jsonify(res)


@app.route("/api/appointments/<int:id>/summary", methods=["GET"])
def get_summary(id):
    db = SessionLocal()
    a = db.query(Appointment).get(id)
    if not a or not a.summary:
        db.close()
        return jsonify({
            "notes": "",
            "prescriptions": [],
            "documents": [],
            "inventory": [],
        })
    s = a.summary
    db.close()
    return jsonify({
        "notes": s.notes,
        "prescriptions": load_json_field(s.prescriptions),
        "documents": load_json_field(s.documents),
        "inventory": load_json_field(s.inventory),
    })


@app.route("/api/appointments/<int:id>/summary", methods=["POST"])
def save_summary(id):
    data = request.json

    db = SessionLocal()
    a = db.query(Appointment).get(id)

    if not a:
        db.close()
        return jsonify({"error": "not_found"}), 404

    if not a.summary:
        a.summary = Summary()

    a.summary.notes = data.get("notes", "")
    a.summary.prescriptions = json.dumps(data.get("prescriptions", []))
    a.summary.documents = json.dumps(data.get("documents", []))
    a.summary.inventory = json.dumps(data.get("inventory", []))

    a.status = "completed"

    db.commit()
    db.close()
    return jsonify({"message": "saved"})


@app.route("/api/appointments/<int:id>/documents", methods=["POST"])
def upload_document(id):
    doc_name = request.form.get("name")
    doc_type = request.form.get("type")
    file = request.files.get("file")

    if not doc_name or not doc_type or not file:
        return jsonify({"error": "missing_fields"}), 400

    if doc_type not in ("pdf", "img"):
        return jsonify({"error": "invalid_type"}), 400

    if not allowed_file(file.filename, doc_type):
        return jsonify({"error": "invalid_extension"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    file_url = f"/uploads/{filename}"

    db = SessionLocal()
    a = db.query(Appointment).get(id)
    if not a:
        db.close()
        return jsonify({"error": "not_found"}), 404

    if not a.summary:
        a.summary = Summary()

    docs = load_json_field(a.summary.documents)
    docs.append({
        "name": doc_name,
        "type": doc_type,
        "url": file_url
    })
    a.summary.documents = json.dumps(docs)
    db.commit()
    db.close()

    return jsonify({"documents": docs})


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============================================================
#   NEW ENDPOINTS FOR ADD APPOINTMENT PAGE (ONLY ADDITIONS)
# ============================================================

@app.route("/api/patients", methods=["GET"])
def get_patients():
    """
    Return patients from patients table.
    Frontend uses: id + full name.
    """
    db = SessionLocal()
    rows = db.query(Patient).all()
    result = [
        {
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}".strip()
        }
        for p in rows
    ]
    db.close()
    return jsonify(result)


@app.route("/api/staff/dentists", methods=["GET"])
def get_dentists():
    """
    Return ONLY dentists from staff table (role='dentist')
    """
    db = SessionLocal()
    dentists = db.query(Staff).filter(Staff.role == "dentist").all()
    result = [{"id": d.id, "name": d.name} for d in dentists]
    db.close()
    return jsonify(result)


@app.route("/api/appointments", methods=["POST"])
def create_appointment():
    """
    Create new appointment with status 'scheduled'
    Used by Add Appointment page.
    """
    data = request.json or {}

    required = ["patient", "date", "time", "dentist", "procedure"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    db = SessionLocal()
    appt = Appointment(
        date=data["date"],
        time=data["time"],
        patient=data["patient"],
        dentist=data["dentist"],
        procedure=data["procedure"],
        status="scheduled",
    )
    db.add(appt)
    db.commit()
    db.close()

    return jsonify({"message": "created"}), 201
# ============================================================


if __name__ == "__main__":
    app.run(debug=True)




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
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from models import (
    db,
    Role,
    Staff,
    Patient,
    MedicalRecord,
    MedicalDocument,
    Prescription,
    TreatmentPlan,
)


def create_app():
    app = Flask(__name__, instance_relative_config=True)

    # Make sure the instance folder exists (for SQLite DB)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # ---- Config: ABSOLUTE path for the SQLite DB ----
    db_path = os.path.join(app.instance_path, "dentist.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # Allow frontend on Vite dev server
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    # ---------- ROUTES ----------

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    # ----- AUTH (example) -----
    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        staff = Staff.query.filter_by(email=email).first()
        if not staff or not check_password_hash(staff.password_hash, password):
            return jsonify({"error": "Invalid credentials."}), 401

        return jsonify({"message": "Login successful.", "staff_id": staff.id}), 200

    # ----- MEDICAL RECORD API -----

    @app.route("/api/patients/<int:patient_id>/medical-record", methods=["GET"])
    def get_medical_record(patient_id):
        patient = Patient.query.get(patient_id)
        if patient is None:
            return jsonify({"error": "Patient not found."}), 404

        record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
        documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()

        if record is None:
            record_data = {
                "patient_id": patient_id,
                "past_diagnoses": "",
                "allergies": "",
                "medications": "",
            }
        else:
            record_data = record.to_dict()

        docs_data = [doc.to_dict() for doc in documents]

        return jsonify(
            {
                "patient": patient.to_dict(),
                "medical_history": record_data,
                "documents": docs_data,
            }
        ), 200

    @app.route("/api/patients/<int:patient_id>/medical-history", methods=["PUT"])
    def update_medical_history(patient_id):
        patient = Patient.query.get(patient_id)
        if patient is None:
            return jsonify({"error": "Patient not found."}), 404

        data = request.get_json() or {}
        past_diagnoses = data.get("past_diagnoses", "")
        allergies = data.get("allergies", "")
        medications = data.get("medications", "")

        record = MedicalRecord.query.filter_by(patient_id=patient_id).first()
        if record is None:
            record = MedicalRecord(
                patient_id=patient_id,
                past_diagnoses=past_diagnoses,
                allergies=allergies,
                medications=medications,
            )
            db.session.add(record)
        else:
            record.past_diagnoses = past_diagnoses
            record.allergies = allergies
            record.medications = medications

        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Medical history saved.",
                    "medical_history": record.to_dict(),
                }
            ),
            200,
        )

    @app.route("/api/patients/<int:patient_id>/documents", methods=["GET", "POST"])
    def documents_for_patient(patient_id):
        patient = Patient.query.get(patient_id)
        if patient is None:
            return jsonify({"error": "Patient not found."}), 404

        if request.method == "GET":
            documents = MedicalDocument.query.filter_by(
                patient_id=patient_id
            ).all()
            return jsonify([doc.to_dict() for doc in documents]), 200

        data = request.get_json() or {}
        name = data.get("name")
        date = data.get("date")
        doc_type = data.get("type")

        if not name or not date or not doc_type:
            return jsonify({"error": "name, date and type are required."}), 400

        doc = MedicalDocument(
            patient_id=patient_id, name=name, date=date, doc_type=doc_type
        )
        db.session.add(doc)
        db.session.commit()

        return (
            jsonify({"message": "Document added.", "document": doc.to_dict()}),
            201,
        )

    # ----- PRESCRIPTIONS API -----

    @app.route(
        "/api/patients/<int:patient_id>/prescriptions", methods=["GET", "POST"]
    )
    def prescriptions_for_patient(patient_id):
        """
        GET  -> list prescriptions for a patient
        POST -> create new prescription
        """
        patient = Patient.query.get(patient_id)
        if patient is None:
            return jsonify({"error": "Patient not found."}), 404

        if request.method == "GET":
            prescs = Prescription.query.filter_by(patient_id=patient_id).all()
            return jsonify([p.to_dict() for p in prescs]), 200

        data = request.get_json() or {}
        medication = data.get("medication")
        dosage = data.get("dosage")
        frequency = data.get("frequency")
        date_issued = data.get("date_issued")
        prescribing_dentist = data.get("prescribing_dentist")

        if (
            not medication
            or not dosage
            or not frequency
            or not date_issued
            or not prescribing_dentist
        ):
            return (
                jsonify(
                    {
                        "error": "medication, dosage, frequency, date_issued and prescribing_dentist are required."
                    }
                ),
                400,
            )

        presc = Prescription(
            patient_id=patient_id,
            medication=medication,
            dosage=dosage,
            frequency=frequency,
            date_issued=date_issued,
            prescribing_dentist=prescribing_dentist,
        )
        db.session.add(presc)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Prescription added.",
                    "prescription": presc.to_dict(),
                }
            ),
            201,
        )

    @app.route("/api/prescriptions/<int:prescription_id>", methods=["PUT"])
    def update_prescription(prescription_id):
        """
        Update a single prescription.
        """
        presc = Prescription.query.get(prescription_id)
        if presc is None:
            return jsonify({"error": "Prescription not found."}), 404

        data = request.get_json() or {}
        presc.medication = data.get("medication", presc.medication)
        presc.dosage = data.get("dosage", presc.dosage)
        presc.frequency = data.get("frequency", presc.frequency)
        presc.date_issued = data.get("date_issued", presc.date_issued)
        presc.prescribing_dentist = data.get(
            "prescribing_dentist", presc.prescribing_dentist
        )

        db.session.commit()

        return jsonify(
            {
                "message": "Prescription updated.",
                "prescription": presc.to_dict(),
            }
        ), 200

    # ----- TREATMENT PLANS API -----

    @app.route(
        "/api/patients/<int:patient_id>/treatments", methods=["GET", "POST"]
    )
    def treatments_for_patient(patient_id):
        """
        GET  -> list treatment plans for a patient
        POST -> create new treatment
        body: {
          "procedure": "...",
          "tooth": "Tooth #14",
          "date": "YYYY-MM-DD",
          "cost": "800",
          "status": "Proposed" or "Completed"
        }
        """
        patient = Patient.query.get(patient_id)
        if patient is None:
            return jsonify({"error": "Patient not found."}), 404

        if request.method == "GET":
            items = TreatmentPlan.query.filter_by(patient_id=patient_id).all()
            return jsonify([t.to_dict() for t in items]), 200

        data = request.get_json() or {}
        procedure = data.get("procedure")
        tooth = data.get("tooth")
        date = data.get("date")
        cost = data.get("cost")
        status = data.get("status")

        if not procedure or not date or not cost or not status:
            return (
                jsonify(
                    {
                        "error": "procedure, date, cost and status are required."
                    }
                ),
                400,
            )

        if status not in ("Proposed", "Completed"):
            return jsonify({"error": "status must be Proposed or Completed."}), 400

        t = TreatmentPlan(
            patient_id=patient_id,
            procedure=procedure,
            tooth=tooth,
            date=date,
            cost=cost,
            status=status,
        )
        db.session.add(t)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Treatment added.",
                    "treatment": t.to_dict(),
                }
            ),
            201,
        )

    @app.route("/api/treatments/<int:treatment_id>", methods=["PUT"])
    def update_treatment(treatment_id):
        """
        Update a single treatment plan.
        """
        t = TreatmentPlan.query.get(treatment_id)
        if t is None:
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

        return jsonify(
            {
                "message": "Treatment updated.",
                "treatment": t.to_dict(),
            }
        ), 200

    return app


# ---------- DB INIT & SEED ----------


def seed_initial_data(app):
    """
    Create default roles, staff, demo patient, medical data,
    documents, prescriptions and treatment plans so UI has data.
    """
    with app.app_context():
        # Roles
        if Role.query.count() == 0:
            admin_role = Role(name="Admin")
            dentist_role = Role(name="Dentist")
            db.session.add_all([admin_role, dentist_role])
            db.session.commit()
        else:
            admin_role = Role.query.filter_by(name="Admin").first()
            dentist_role = Role.query.filter_by(name="Dentist").first()

        # Staff (one demo user)
        if Staff.query.count() == 0:
            demo_staff = Staff(
                full_name="Dr. Sarah Miller",
                email="sarah@example.com",
                password_hash=generate_password_hash("password123"),
                role_id=dentist_role.id if dentist_role else None,
            )
            db.session.add(demo_staff)

        # Demo patient with id = 1
        if Patient.query.count() == 0:
            patient = Patient(
                full_name="John Doe",
                date_of_birth="1990-05-10",
                phone="+1 555-1234",
                email="john.doe@example.com",
            )
            db.session.add(patient)
            db.session.commit()
        else:
            patient = Patient.query.first()

        # Medical record
        record = MedicalRecord.query.filter_by(patient_id=patient.id).first()
        if record is None:
            record = MedicalRecord(
                patient_id=patient.id,
                past_diagnoses="History of cavities and gingivitis, last treated in 2022",
                allergies="Penicillin, Aspirin",
                medications="Currently taking ibuprofen for pain relief",
            )
            db.session.add(record)

        # Documents
        if MedicalDocument.query.filter_by(patient_id=patient.id).count() == 0:
            docs = [
                MedicalDocument(
                    patient_id=patient.id,
                    name="X-Ray Scan",
                    date="2023-08-15",
                    doc_type="Radiology",
                ),
                MedicalDocument(
                    patient_id=patient.id,
                    name="Treatment Plan",
                    date="2023-07-20",
                    doc_type="Dental Plan",
                ),
                MedicalDocument(
                    patient_id=patient.id,
                    name="Medical History Form",
                    date="2023-07-10",
                    doc_type="Patient Record",
                ),
            ]
            db.session.add_all(docs)

        # Prescriptions (for demo UI)
        if Prescription.query.filter_by(patient_id=patient.id).count() == 0:
            prescs = [
                Prescription(
                    patient_id=patient.id,
                    medication="Amoxicillin",
                    dosage="500mg",
                    frequency="Three times a day",
                    date_issued="2024-01-15",
                    prescribing_dentist="Dr. Sarah Miller",
                ),
                Prescription(
                    patient_id=patient.id,
                    medication="Ibuprofen",
                    dosage="200mg",
                    frequency="As needed",
                    date_issued="2024-02-20",
                    prescribing_dentist="Dr. Sarah Miller",
                ),
                Prescription(
                    patient_id=patient.id,
                    medication="Codeine",
                    dosage="30mg",
                    frequency="Every 4–6 hours",
                    date_issued="2024-03-10",
                    prescribing_dentist="Dr. David Lee",
                ),
                Prescription(
                    patient_id=patient.id,
                    medication="Acetaminophen",
                    dosage="500mg",
                    frequency="Every 6 hours",
                    date_issued="2024-04-05",
                    prescribing_dentist="Dr. David Lee",
                ),
                Prescription(
                    patient_id=patient.id,
                    medication="Naproxen",
                    dosage="250mg",
                    frequency="Twice a day",
                    date_issued="2024-05-12",
                    prescribing_dentist="Dr. Sarah Miller",
                ),
            ]
            db.session.add_all(prescs)

        # Treatment plans (for demo UI)
        if TreatmentPlan.query.filter_by(patient_id=patient.id).count() == 0:
            treatments = [
                TreatmentPlan(
                    patient_id=patient.id,
                    procedure="Crown",
                    tooth="Tooth #14",
                    date="2023-09-05",
                    cost="800",
                    status="Proposed",
                ),
                TreatmentPlan(
                    patient_id=patient.id,
                    procedure="Whitening",
                    tooth="All Teeth",
                    date="2023-09-12",
                    cost="300",
                    status="Proposed",
                ),
                TreatmentPlan(
                    patient_id=patient.id,
                    procedure="Filling",
                    tooth="Tooth #3",
                    date="2023-08-29",
                    cost="150",
                    status="Completed",
                ),
            ]
            db.session.add_all(treatments)

        db.session.commit()


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    seed_initial_data(app)

    app.run(debug=True)
