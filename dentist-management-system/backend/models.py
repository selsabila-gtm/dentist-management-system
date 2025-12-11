# backend/models.py

import os
import json
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

# ---------- CONFIG (shared) ----------

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

# ---------- DB EXTENSION (single instance) ----------

db = SQLAlchemy()

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


# ---------- MODELS (exactly as your old app.py) ----------

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
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    # team also uses full_name in some places
    full_name = db.Column(db.String(200))

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
        full_name = (
            self.full_name
            or f"{self.first_name or ''} {self.last_name or ''}".strip()
        )
        return {
            "id": self.id,
            # name fields (old + new frontend)
            "name": full_name,
            "full_name": full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            # contact
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            # auth
            "username": self.username,
            # schedule
            "availability": self.availability,
            "days_available": self.days_available,
            "hours": self.hours,
            # permissions object for checkboxes
            "permissions": load_json_field(self.permissions),
            # role
            "role": self.role.to_dict() if self.role else None,
            "role_name": self.role.name if self.role else None,
            "role_id": self.role_id,
        }


class Patient(db.Model):
    __tablename__ = "patients"
    id = db.Column(db.Integer, primary_key=True)

    # team uses full_name in seeds & queries
    full_name = db.Column(db.String(200))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))

    date_of_birth = db.Column(db.String(20))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(150))
    gender = db.Column(db.String(20))
    adress = db.Column(db.String(255))
    insurance_provider = db.Column(db.String(150))
    insurance_policy_number = db.Column(db.String(100))
    groupe_number = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "date_of_birth": self.date_of_birth,
            "phone": self.phone,
            "email": self.email,
            "gender": self.gender,
            "adress": self.adress,
            "insurance_provider": self.insurance_provider,
            "insurance_policy_number": self.insurance_policy_number,
            "groupe_number": self.groupe_number,
        }


class Appointment(db.Model):
    __tablename__ = "appointments"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20))
    time = db.Column(db.String(20))

    # display name strings (used by routes + frontend)
    patient = db.Column(db.String(200))
    dentist = db.Column(db.String(200))

    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=True)
    dentist_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=True)
    procedure = db.Column(db.String(200))
    status = db.Column(db.String(20), default="scheduled")
    summary_id = db.Column(db.Integer, db.ForeignKey("summaries.id"), nullable=True)

    # disambiguate FK path between appointments <-> summaries
    summary = db.relationship(
        "Summary",
        back_populates="appointment",
        uselist=False,
        foreign_keys="Summary.appointment_id",
        primaryjoin="Appointment.id == Summary.appointment_id",
    )

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
            "summary_id": self.summary_id,
        }


class Summary(db.Model):
    __tablename__ = "summaries"
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))
    notes = db.Column(db.Text)
    prescriptions = db.Column(db.Text)  # JSON list
    documents = db.Column(db.Text)  # JSON list of docs
    inventory = db.Column(db.Text)  # JSON list

    appointment = db.relationship(
        "Appointment",
        back_populates="summary",
        uselist=False,
        foreign_keys=[appointment_id],
        primaryjoin="Summary.appointment_id == Appointment.id",
    )

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
    file_path = db.Column(db.String(300), nullable=True)  # optional path

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


# ---------- DB SEED (same as old app.py) ----------

def seed_initial_data():
    # Called with app context
    if Role.query.count() == 0:
        roles = [
            Role(name="Admin"),
            Role(name="Dentist"),
            Role(name="Receptionist"),
            Role(name="Manager"),
        ]
        db.session.add_all(roles)
        db.session.commit()

    if Staff.query.count() == 0:
        dentist_role = Role.query.filter_by(name="Dentist").first()
        admin_role = Role.query.filter_by(name="Admin").first()

        staff_items = [
            Staff(
                full_name="Dr. Sarah Miller",
                first_name="Sarah",
                last_name="Miller",
                email="sarah@example.com",
                username="sarah",
                password_hash=generate_password_hash("password123"),
                role_id=dentist_role.id if dentist_role else None,
            ),
            Staff(
                full_name="Dr. David Lee",
                first_name="David",
                last_name="Lee",
                email="david@example.com",
                username="david",
                password_hash=generate_password_hash("password123"),
                role_id=dentist_role.id if dentist_role else None,
            ),
            Staff(
                full_name="Emma Lopez",
                first_name="Emma",
                last_name="Lopez",
                email="emma@example.com",
                username="emma",
                password_hash=generate_password_hash("password123"),
                role_id=admin_role.id if admin_role else None,
            ),
        ]
        db.session.add_all(staff_items)
        db.session.commit()

    if Patient.query.count() == 0:
        p = Patient(
            full_name="John Doe",
            first_name="John",
            last_name="Doe",
            date_of_birth="1990-05-10",
            phone="+1 555-1234",
            email="john.doe@example.com",
        )
        p2 = Patient(
            full_name="Sophia Clark",
            first_name="Sophia",
            last_name="Clark",
            phone="555-0101",
            email="sophia.clark@example.com",
        )
        p3 = Patient(
            full_name="Ethan Harper",
            first_name="Ethan",
            last_name="Harper",
            phone="555-0102",
            email="ethan.harper@example.com",
        )
        db.session.add_all([p, p2, p3])
        db.session.commit()

    if Appointment.query.count() == 0:
        sophia = Patient.query.filter_by(first_name="Sophia").first()
        ethan = Patient.query.filter_by(first_name="Ethan").first()

        appts = [
            Appointment(
                date="2025-11-26",
                time="09:00 AM",
                patient="Sophia Clark",
                patient_id=sophia.id if sophia else None,
                dentist="Dr. Sarah Miller",
                procedure="Routine Checkup",
                status="scheduled",
            ),
            Appointment(
                date="2025-11-26",
                time="10:30 AM",
                patient="Ethan Harper",
                patient_id=ethan.id if ethan else None,
                dentist="Dr. David Lee",
                procedure="Teeth Cleaning",
                status="scheduled",
            ),
        ]
        db.session.add_all(appts)
        db.session.commit()

    # demo medical record, prescriptions, treatment plans
    john = Patient.query.filter_by(full_name="John Doe").first()
    if john and MedicalRecord.query.filter_by(patient_id=john.id).count() == 0:
        record = MedicalRecord(
            patient_id=john.id,
            past_diagnoses="History of cavities",
            allergies="Penicillin",
            medications="Ibuprofen",
        )
        db.session.add(record)
    if john and Prescription.query.filter_by(patient_id=john.id).count() == 0:
        presc = Prescription(
            patient_id=john.id,
            medication="Amoxicillin",
            dosage="500mg",
            frequency="Three times a day",
            date_issued="2024-01-15",
            prescribing_dentist="Dr. Sarah Miller",
        )
        db.session.add(presc)
    if john and TreatmentPlan.query.filter_by(patient_id=john.id).count() == 0:
        t = TreatmentPlan(
            patient_id=john.id,
            procedure="Filling",
            tooth="Tooth #3",
            date="2023-08-29",
            cost="150",
            status="Completed",
        )
        db.session.add(t)
    db.session.commit()