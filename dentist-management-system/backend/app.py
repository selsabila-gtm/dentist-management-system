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

if __name__ == "__main__":
    app.run(debug=True)



