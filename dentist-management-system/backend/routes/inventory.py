from datetime import datetime
from flask import request, jsonify

from backend.routes import bp
from backend.models import db, InventoryCategory, InventoryItem

#categories
@bp.route("/api/inventory/categories", methods=["GET"])
def get_inventory_categories():
    categories = InventoryCategory.query.order_by(InventoryCategory.name).all()
    return jsonify([c.to_dict() for c in categories]), 200


@bp.route("/api/inventory/categories", methods=["POST"])
def create_inventory_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    description = data.get("description", "")
    if not name:
        return jsonify({"error": "Category name is required"}), 400

    existing = InventoryCategory.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 400

    category = InventoryCategory(name=name, description=description)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


#items
@bp.route("/api/inventory", methods=["GET"])
def get_inventory_items():
    items = InventoryItem.query.order_by(InventoryItem.item_name).all()
    return jsonify([item.to_dict() for item in items]), 200


@bp.route("/api/inventory", methods=["POST"])
def create_inventory_item():
    data = request.get_json() or {}
    item_name = (data.get("item_name") or "").strip()
    if not item_name:
        return jsonify({"error": "Item name is required"}), 400

    try:
        quantity = int(data.get("quantity") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid quantity"}), 400

    try:
        minimum_stock = int(data.get("minimum_stock") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid minimum_stock"}), 400

    price_raw = data.get("price_per_unit")
    price_value = None
    if price_raw is not None and price_raw != "":
        try:
            price_value = float(price_raw)
            if price_value < 0:
                raise ValueError("negative")
        except Exception:
            return jsonify({"error": "Invalid price_per_unit"}), 400

    try:
        item = InventoryItem(
            item_name=item_name,
            category_id=data.get("category_id"),
            quantity=quantity,
            minimum_stock=minimum_stock,
            supplier=data.get("supplier"),
            expiration_date=data.get("expiration_date") or "N/A",
            notes=data.get("notes"),
            last_updated=datetime.utcnow().strftime("%Y-%m-%d"),
            price_per_unit=price_value,
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create item", "detail": str(e)}), 500


@bp.route("/api/inventory/<int:item_id>", methods=["GET"])
def get_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    return jsonify(item.to_dict()), 200


@bp.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json() or {}

    for field in ("item_name", "category_id", "supplier", "expiration_date", "notes"):
        if field in data:
            setattr(item, field, data[field])

    if "quantity" in data:
        try:
            item.quantity = int(data["quantity"])
        except (TypeError, ValueError):
            pass

    if "minimum_stock" in data:
        try:
            item.minimum_stock = int(data["minimum_stock"])
        except (TypeError, ValueError):
            pass

    if "price_per_unit" in data:
        pp = data["price_per_unit"]
        if pp in (None, ""):
            item.price_per_unit = None
        else:
            try:
                ppv = float(pp)
                if ppv < 0:
                    pass
                else:
                    item.price_per_unit = ppv
            except Exception:
                pass

    item.last_updated = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        db.session.commit()
        return jsonify(item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update item", "detail": str(e)}), 500


@bp.route("/api/inventory/<int:item_id>", methods=["DELETE"])
def delete_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    try:
        db.session.delete(item)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete item", "detail": str(e)}), 500

