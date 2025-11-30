from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

<<<<<<< HEAD
    def to_dict(self):
        return {"id": self.id, "name": self.name}
=======
    def __repr__(self):
        return f"<Role {self.name}>"
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7


class Staff(db.Model):
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
<<<<<<< HEAD

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))

    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", backref="staff_members")

    permissions = db.Column(db.JSON, nullable=False, default=dict)

    availability = db.Column(db.String(50))
    days_available = db.Column(db.String(255))
    hours = db.Column(db.String(100))

    # NEW: when the employee was created
    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.now()
    )
=======
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=True)

    role = db.relationship("Role", backref="staff_members")

    def __repr__(self):
        return f"<Staff {self.email}>"


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    date_of_birth = db.Column(db.String(10), nullable=True)  # YYYY-MM-DD
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7

    def to_dict(self):
        return {
            "id": self.id,
<<<<<<< HEAD
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "username": self.username,
            "role_id": self.role_id,
            "role_name": self.role.name if self.role else None,
            "permissions": self.permissions or {},
            "availability": self.availability,
            "days_available": self.days_available,
            "hours": self.hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
=======
            "full_name": self.full_name,
            "date_of_birth": self.date_of_birth,
            "phone": self.phone,
            "email": self.email,
        }

    def __repr__(self):
        return f"<Patient {self.full_name}>"


class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    past_diagnoses = db.Column(db.Text, nullable=True)
    allergies = db.Column(db.String(255), nullable=True)
    medications = db.Column(db.Text, nullable=True)

    patient = db.relationship("Patient", backref="medical_record", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "past_diagnoses": self.past_diagnoses or "",
            "allergies": self.allergies or "",
            "medications": self.medications or "",
        }


class MedicalDocument(db.Model):
    __tablename__ = "medical_documents"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    doc_type = db.Column(db.String(100), nullable=False)

    patient = db.relationship("Patient", backref="medical_documents")

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "date": self.date,
            "type": self.doc_type,
        }


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)

    medication = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(120), nullable=False)
    date_issued = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    prescribing_dentist = db.Column(db.String(120), nullable=False)

    patient = db.relationship("Patient", backref="prescriptions")

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
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)

    procedure = db.Column(db.String(120), nullable=False)
    tooth = db.Column(db.String(50), nullable=True)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    cost = db.Column(db.String(20), nullable=False)  # store as "800"
    status = db.Column(db.String(20), nullable=False)  # "Proposed" or "Completed"

    patient = db.relationship("Patient", backref="treatment_plans")

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "procedure": self.procedure,
            "tooth": self.tooth,
            "date": self.date,
            "cost": self.cost,
            "status": self.status,
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7
        }
