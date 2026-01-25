from flask import Flask, send_from_directory
from flask_cors import CORS
import os

from backend.models import db, seed_initial_data, SQLALCHEMY_DATABASE_URI, UPLOAD_FOLDER
from backend.routes import bp

def create_app():
    app = Flask(__name__)
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
    
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(INSTANCE_DIR, 'dentist.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📁 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")

    # ✅ Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "http://localhost:5173",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })

    # ✅ Init DB
    db.init_app(app)
    with app.app_context():
        db.create_all()
        seed_initial_data()

    # ✅ REGISTER BLUEPRINT (THIS WAS MISSING)
    app.register_blueprint(bp)

    # Debug routes
    print("\n📋 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  ✓ {rule.rule} -> {rule.endpoint}")
    print()

    return app



if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)