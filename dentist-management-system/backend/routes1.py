# backend/routes.py
import os
import json
from datetime import datetime

from flask import (
    Blueprint,
    jsonify,
    request,
    send_from_directory,
    current_app,
)
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash

from backend.models import (
    db,
    allowed_file,
    load_json_field,
    dumps_field,
    Role,
    Staff,
    Patient,
    Appointment,
    Summary,
    MedicalRecord,
    MedicalDocument,
    Prescription,
    TreatmentPlan,
    Invoice,
    InventoryCategory,
    InventoryItem,
)

bp = Blueprint("api", __name__)


def register_routes(app):
    app.register_blueprint(bp)


bp = Blueprint("api", __name__)

def register_routes(app):
    app.register_blueprint(bp)

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


# ---- AUTH ----
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


# ---- PATIENTS ----
@bp.route("/api/patients", methods=["GET"])
def get_patients():
    rows = Patient.query.all()
    result = [
        {
            "id": p.id,
            "name": p.full_name or f"{p.first_name or ''} {p.last_name or ''}".strip(),
        }
        for p in rows
    ]
    return jsonify(result)


@bp.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json() or {}
    if not data.get("full_name") and not (
        data.get("first_name") and data.get("last_name")
    ):
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


@bp.route("/api/patients/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    p = Patient.query.get_or_404(patient_id)
    return jsonify(p.to_dict())


# ---- APPOINTMENTS ----
@bp.route("/api/appointments", methods=["GET"])
def list_appointments():
    # Get optional dentist_id filter from query params
    dentist_id = request.args.get("dentist_id")
    
    query = Appointment.query
    
    # Filter by dentist_id if provided
    if dentist_id:
        try:
            dentist_id_int = int(dentist_id)
            query = query.filter_by(dentist_id=dentist_id_int)
        except (TypeError, ValueError):
            pass  # Invalid dentist_id, ignore filter
    
    appts = query.order_by(Appointment.date, Appointment.time).all()
    return jsonify([a.to_dict() for a in appts])


@bp.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json() or {}
    required = ["patient", "date", "time", "dentist", "procedure"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    # optional cost for appointment
    cost = data.get("cost")
    try:
        cost_value = float(cost) if cost is not None and cost != "" else 0.0
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid cost value"}), 400

    appt = Appointment(
        date=data["date"],
        time=data["time"],
        patient=data["patient"],
        patient_id=data.get("patient_id"),
        dentist=data["dentist"],
        dentist_id=data.get("dentist_id"),
        procedure=data["procedure"],
        status="scheduled",
        cost=cost_value,
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify({"message": "created", "appointment": appt.to_dict()}), 201


@bp.route("/api/appointments/<int:appt_id>/status", methods=["PUT"])
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
@bp.route("/api/appointments/<int:appt_id>/summary", methods=["GET"])
def get_summary(appt_id):
    a = Appointment.query.get(appt_id)
    if not a:
        return jsonify({"error": "Appointment not found"}), 404
    
    if not a.summary:
        # CHANGED: Return 0.0 instead of a.cost for new summaries
        return jsonify({
            "notes": "",
            "prescriptions": [],
            "documents": [],
            "inventory": [],
            "cost": 0.0
        })
    
    summary_dict = a.summary.to_dict()
    summary_dict["cost"] = a.cost or 0.0
    return jsonify(summary_dict)


@bp.route("/api/appointments/<int:appt_id>/summary", methods=["POST"])
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
    
    # Update cost if provided
    if "cost" in data:
        try:
            a.cost = float(data["cost"]) if data["cost"] else 0.0
        except (ValueError, TypeError):
            a.cost = 0.0
    
    a.status = "completed"
    db.session.commit()
    return jsonify({"message": "saved"})


# ---- DOCUMENT UPLOAD & SERVE ----
# Add this to routes.py - FIXED DOCUMENT UPLOAD

@bp.route("/api/appointments/<int:appt_id>/documents", methods=["POST"])
def upload_document(appt_id):
    """Upload a document (PDF or image) for an appointment"""
    try:
        # Get form data
        doc_name = request.form.get("name")
        doc_type = request.form.get("type")
        file = request.files.get("file")

        # Validation
        if not doc_name or not doc_name.strip():
            return jsonify({"error": "Document name is required"}), 400
        
        if not doc_type:
            return jsonify({"error": "Document type is required"}), 400
            
        if doc_type not in ("pdf", "img"):
            return jsonify({"error": "Document type must be 'pdf' or 'img'"}), 400
        
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Check file extension
        if not allowed_file(file.filename, doc_type):
            allowed_exts = "PDF" if doc_type == "pdf" else "PNG, JPG, JPEG, GIF"
            return jsonify({"error": f"Invalid file type. Allowed: {allowed_exts}"}), 400

        # Get appointment
        a = Appointment.query.get(appt_id)
        if not a:
            return jsonify({"error": "Appointment not found"}), 404

        # Create summary if doesn't exist
        if not a.summary:
            a.summary = Summary(
                appointment_id=appt_id,
                notes="",
                prescriptions="[]",
                documents="[]",
                inventory="[]"
            )
            db.session.add(a.summary)
            db.session.flush()

        # Generate secure filename with timestamp
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        original_filename = secure_filename(file.filename)
        filename = f"{timestamp}_{original_filename}"
        
        # Save file
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)
        save_path = os.path.join(upload_folder, filename)
        
        file.save(save_path)
        
        # Create URL
        file_url = f"/uploads/{filename}"

        # Load existing documents
        docs = load_json_field(a.summary.documents)
        
        # Add new document
        docs.append({
            "name": doc_name.strip(),
            "type": doc_type,
            "url": file_url
        })
        
        # Save to database
        a.summary.documents = json.dumps(docs)
        db.session.commit()

        return jsonify({
            "message": "Document uploaded successfully",
            "documents": docs
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error uploading document: {str(e)}")
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500



# ---- MEDICAL RECORDS, DOCUMENTS, PRESCRIPTIONS, TREATMENTS ----
@bp.route("/api/patients/<int:patient_id>/medical-record", methods=["GET"])
def get_medical_record(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
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
    return (
        jsonify(
            {
                "patient": patient.to_dict(),
                "medical_history": record_data,
                "documents": docs_data,
            }
        ),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/medical-history", methods=["PUT"])
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
        record = MedicalRecord(
            patient_id=patient_id,
            past_diagnoses=past,
            allergies=allergies,
            medications=meds,
        )
        db.session.add(record)
    else:
        record.past_diagnoses = past
        record.allergies = allergies
        record.medications = meds

    db.session.commit()
    return (
        jsonify(
            {"message": "Medical history saved.", "medical_history": record.to_dict()}
        ),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/documents", methods=["GET", "POST"])
def documents_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found."}), 404

    if request.method == "GET":
        documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
        return jsonify([d.to_dict() for d in documents]), 200

    data = request.get_json() or {}
    name = data.get("name")
    date = data.get("date")
    doc_type = data.get("type")
    if not name or not date or not doc_type:
        return jsonify({"error": "name, date and type are required."}), 400

    doc = MedicalDocument(
        patient_id=patient_id,
        name=name,
        date=date,
        doc_type=doc_type,
    )
    db.session.add(doc)
    db.session.commit()
    return (
        jsonify({"message": "Document added.", "document": doc.to_dict()}),
        201,
    )


@bp.route("/api/patients/<int:patient_id>/prescriptions", methods=["GET", "POST"])
def prescriptions_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
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
        jsonify({"message": "Prescription added.", "prescription": presc.to_dict()}),
        201,
    )


@bp.route("/api/prescriptions/<int:prescription_id>", methods=["PUT"])
def update_prescription(prescription_id):
    presc = Prescription.query.get(prescription_id)
    if not presc:
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
    return (
        jsonify({"message": "Prescription updated.", "prescription": presc.to_dict()}),
        200,
    )


@bp.route("/api/patients/<int:patient_id>/treatments", methods=["GET", "POST"])
def treatments_for_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
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
            jsonify({"error": "procedure, date, cost and status are required."}),
            400,
        )
    if status not in ("Proposed", "Completed"):
        return (
            jsonify({"error": "status must be Proposed or Completed."}),
            400,
        )

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
        jsonify({"message": "Treatment added.", "treatment": t.to_dict()}),
        201,
    )


@bp.route("/api/treatments/<int:treatment_id>", methods=["PUT"])
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
    return (
        jsonify({"message": "Treatment updated.", "treatment": t.to_dict()}),
        200,
    )


# ---------- BILLING HELPERS & INVOICES ----------

def _calculate_billing_for_patient(patient_id: int):
    """Return (total_cost_from_appointments, total_paid_from_invoices, outstanding)."""
    appts = Appointment.query.filter_by(patient_id=patient_id).all()
    total_cost = 0.0
    for a in appts:
        try:
            total_cost += float(a.cost or 0)
        except (TypeError, ValueError):
            continue

    paid_sum = (
        db.session.query(db.func.coalesce(db.func.sum(Invoice.amount), 0.0))
        .filter(Invoice.patient_id == patient_id)
        .scalar()
        or 0.0
    )

    outstanding = max(total_cost - paid_sum, 0.0)
    return total_cost, paid_sum, outstanding


@bp.route("/api/patients/<int:patient_id>/billing-summary", methods=["GET"])
def get_billing_summary(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    total_cost, paid_sum, outstanding = _calculate_billing_for_patient(patient_id)

    return jsonify(
        {
            "patient_id": patient_id,
            "patient_name": patient.full_name
            or f"{patient.first_name or ''} {patient.last_name or ''}".strip(),
            "total_cost": total_cost,
            "total_paid": paid_sum,
            "outstanding": outstanding,
        }
    )


@bp.route("/api/invoices", methods=["GET", "POST"])
def invoices_collection():
    if request.method == "GET":
        search = (request.args.get("q") or "").lower().strip()
        patient_id = request.args.get("patient_id")
        sort_by = request.args.get("sort_by", "date")
        sort_dir = request.args.get("sort_dir", "desc")

        query = Invoice.query

        if patient_id:
            try:
                pid = int(patient_id)
                query = query.filter(Invoice.patient_id == pid)
            except ValueError:
                pass

        # basic ordering
        if sort_by == "amount":
            col = Invoice.amount
        elif sort_by == "due_date":
            col = Invoice.due_date
        else:
            col = Invoice.date

        if sort_dir == "asc":
            query = query.order_by(col.asc())
        else:
            query = query.order_by(col.desc())

        invoices = query.all()

        # simple search on patient name or invoice number
        if search:
            filtered = []
            for inv in invoices:
                name = (
                    inv.patient.full_name
                    or f"{inv.patient.first_name or ''} {inv.patient.last_name or ''}".strip()
                    if inv.patient
                    else ""
                )
                combined = f"{name} {inv.invoice_number or ''}".lower()
                if search in combined:
                    filtered.append(inv)
            invoices = filtered

        return jsonify([inv.to_dict() for inv in invoices])

    # POST: create new invoice/payment
    data = request.get_json() or {}
    patient_id = data.get("patient_id")
    amount = data.get("amount")

    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
    try:
        patient_id = int(patient_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid patient_id"}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    try:
        amount_value = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    if amount_value <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    total_cost, paid_sum, outstanding = _calculate_billing_for_patient(patient_id)

    if outstanding <= 0:
        return jsonify({"error": "This patient has no outstanding balance."}), 400

    if amount_value > outstanding + 1e-6:
        return jsonify(
            {
                "error": "Amount exceeds outstanding balance.",
                "outstanding": outstanding,
            }
        ), 400

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    # simple auto invoice number
    last = Invoice.query.order_by(Invoice.id.desc()).first()
    next_id = (last.id + 1) if last else 1
    invoice_number = f"INV-{datetime.utcnow().year}-{next_id:04d}"

    inv = Invoice(
        patient_id=patient_id,
        appointment_id=data.get("appointment_id"),
        amount=amount_value,
        date=data.get("date") or today_str,
        due_date=data.get("due_date") or today_str,
        invoice_number=data.get("invoice_number") or invoice_number,
    )

    db.session.add(inv)
    db.session.commit()

    return jsonify(inv.to_dict()), 201



