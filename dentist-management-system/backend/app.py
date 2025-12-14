from flask import Flask
from flask_cors import CORS

from backend.models import *
from backend.routes import bp


def create_app():
    app = Flask(__name__)

    # BASIC CONFIG (temporary if you don't have config.py)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dentist.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = "uploads"

    # ENABLE CORS
    CORS(app, supports_credentials=True)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_initial_data()

    app.register_blueprint(bp)

    return app



if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
