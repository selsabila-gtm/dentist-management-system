from datetime import datetime
from flask import request, jsonify

from backend.routes import bp
from backend.models import db, InventoryCategory, InventoryItem


@bp.route("/api/inventory", methods=["GET"])
def list_inventory():
    return jsonify([i.to_dict() for i in InventoryItem.query.all()])


@bp.route("/api/inventory", methods=["POST"])
def create_inventory():
    data = request.get_json() or {}
    item = InventoryItem(**data)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201
