import os
import json
from datetime import datetime
from flask import request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename

from backend.routes import bp
from backend.models import (
    db,
    Appointment,
    Summary,
    InventoryItem,
    Staff,
    Role,
    allowed_file,
    load_json_field,
    dumps_field,
)


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


# ✅ UPDATED: Get dentist availability from Staff table
@bp.route("/api/appointments/dentist/<int:dentist_id>/availability", methods=["GET"])
def get_dentist_availability(dentist_id):
    """Get dentist availability including days and hours from Staff table"""
    staff = Staff.query.get(dentist_id)
    
    if not staff:
        return jsonify({"error": "Staff member not found"}), 404
    
    # Check if this staff member is actually a dentist
    dentist_role = Role.query.filter_by(name="Dentist").first()
    if dentist_role and staff.role_id != dentist_role.id:
        return jsonify({"error": "Staff member is not a dentist"}), 400
    
    # ✅ Return data directly from Staff table
    return jsonify({
        "id": staff.id,
        "name": staff.full_name or f"{staff.first_name or ''} {staff.last_name or ''}".strip(),
        "days_available": staff.days_available,  # From Staff.days_available column
        "hours": staff.hours  # From Staff.hours column
    }), 200


# ---- SUMMARIES ----
@bp.route("/api/appointments/<int:appt_id>/summary", methods=["GET"])
def get_summary(appt_id):
    a = Appointment.query.get(appt_id)
    if not a:
        return jsonify({"error": "Appointment not found"}), 404
    
    if not a.summary:
        # Return default structure with 0.0 cost for new summaries
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
    
    # ✅ NEW: Get old inventory to compare changes
    old_inventory = []
    if a.summary:
        old_inventory = load_json_field(a.summary.inventory)
    
    # ✅ Validate inventory quantities BEFORE saving
    inventory_items = data.get("inventory", [])
    inventory_errors = []
    
    for idx, item_data in enumerate(inventory_items):
        item_id = item_data.get("item_id")
        requested_qty = item_data.get("quantity", 0)
        
        # Get the actual inventory item from database
        inventory_item = InventoryItem.query.get(item_id)
        
        if not inventory_item:
            inventory_errors.append({
                "index": idx,
                "message": f"Item not found in inventory"
            })
            continue
        
        # ✅ NEW: Check if this item quantity was changed
        old_item = next((item for item in old_inventory if item.get("item_id") == item_id), None)
        old_qty = old_item.get("quantity", 0) if old_item else 0
        qty_difference = requested_qty - old_qty
        
        # Check if enough stock is available for the NEW quantity needed
        if inventory_item.quantity < qty_difference:
            inventory_errors.append({
                "index": idx,
                "item_name": inventory_item.item_name,
                "requested": requested_qty,
                "available": inventory_item.quantity + old_qty,
                "message": f"Insufficient stock. Available: {inventory_item.quantity + old_qty}, Requested: {requested_qty}"
            })
    
    # If there are inventory errors, return them
    if inventory_errors:
        return jsonify({
            "error": "insufficient_stock",
            "inventory_errors": inventory_errors
        }), 400
    
    # Create or update summary
    if not a.summary:
        a.summary = Summary(appointment_id=appt_id, inventory="[]")
    
    a.summary.notes = data.get("notes", "")
    a.summary.prescriptions = dumps_field(data.get("prescriptions", []))
    a.summary.documents = dumps_field(data.get("documents", []))
    a.summary.inventory = dumps_field(inventory_items)
    
    # Update cost if provided
    if "cost" in data:
        try:
            a.cost = float(data["cost"]) if data["cost"] else 0.0
        except (ValueError, TypeError):
            a.cost = 0.0
    
    # ✅ NEW: Only update inventory quantities for items that changed
    for item_data in inventory_items:
        item_id = item_data.get("item_id")
        new_qty = item_data.get("quantity", 0)
        
        # Find if this item existed before
        old_item = next((item for item in old_inventory if item.get("item_id") == item_id), None)
        old_qty = old_item.get("quantity", 0) if old_item else 0
        
        # Only deduct the difference
        qty_difference = new_qty - old_qty
        
        if qty_difference != 0:
            inventory_item = InventoryItem.query.get(item_id)
            if inventory_item:
                inventory_item.quantity -= qty_difference
                inventory_item.last_updated = datetime.now().strftime("%Y-%m-%d")
    
    a.status = "completed"
    
    try:
        db.session.commit()
        return jsonify({"message": "saved"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save: {str(e)}"}), 500


# ✅ Endpoint to check inventory stock availability
@bp.route("/api/inventory/<int:item_id>/check-stock", methods=["POST"])
def check_inventory_stock(item_id):
    """Check if requested quantity is available in stock"""
    data = request.json or {}
    requested_qty = data.get("quantity", 0)
    
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    
    available = item.quantity >= requested_qty
    
    return jsonify({
        "available": available,
        "stock_quantity": item.quantity,
        "requested_quantity": requested_qty,
        "item_name": item.item_name
    })


# ---- DOCUMENT UPLOAD & SERVE ----
@bp.route("/api/appointments/<int:appt_id>/documents", methods=["POST"])
def upload_document(appt_id):
    """Upload a document (PDF or image) for an appointment"""
    try:
        # Get form data
        doc_name = request.form.get("name")
        doc_type = request.form.get("type")
        file = request.files.get("file")

        print(f"=== Upload Debug ===")
        print(f"Appointment ID: {appt_id}")
        print(f"Document name: {doc_name}")
        print(f"Document type: {doc_type}")
        print(f"File: {file}")
        print(f"Request files: {request.files}")
        print(f"Request form: {request.form}")

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
        
        print(f"Saving to: {save_path}")
        file.save(save_path)
        print(f"File saved successfully")
        
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

        print(f"Document saved to DB successfully")
        return jsonify({
            "message": "Document uploaded successfully",
            "documents": docs
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error uploading document: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500


@bp.route("/uploads/<path:filename>")
def serve_upload(filename):
    """Serve uploaded files"""
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)