# backend/routes/__init__.py

from flask import jsonify

from .auth import auth_bp
from .staff import staff_bp
from .patient import patient_bp
from .appointment import appointment_bp
from .medical import medical_bp


def register_blueprints(app):
    """Register all blueprint routes with the Flask app."""
    
    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200
    
    # Register all blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(medical_bp)