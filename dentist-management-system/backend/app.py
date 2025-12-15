from flask import Flask, send_from_directory
from flask_cors import CORS
import os

from backend.models import db, seed_initial_data, SQLALCHEMY_DATABASE_URI, UPLOAD_FOLDER


def create_app():
    app = Flask(__name__)

    # Use paths from models.py to ensure consistency
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

    # ENABLE CORS
    CORS(app, supports_credentials=True)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_initial_data()

    # Import and register blueprint AFTER app context setup
    from backend.routes import bp
    app.register_blueprint(bp)

    return app


# Create the app instance
app = create_app()


if __name__ == "__main__":
    app.run(debug=True)