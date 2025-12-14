# backend/app.py

from flask import Flask
from flask_cors import CORS

from backend.models import (
    db,
    SQLALCHEMY_DATABASE_URI,
    UPLOAD_FOLDER,
    MAX_CONTENT_LENGTH,
    seed_initial_data,
)

def create_app():
    app = Flask(__name__, instance_relative_config=True)

    # config from models
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5174", "http://127.0.0.1:5000"]}},
        supports_credentials=True,
    )

    # bind db to this app
    db.init_app(app)

    # register routes via blueprint
    from backend.routes import register_routes
    register_routes(app)

    # create tables + seed data (no dropping)
    with app.app_context():
        db.create_all()
        seed_initial_data()

    return app

# global app used by "python -m app"
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)