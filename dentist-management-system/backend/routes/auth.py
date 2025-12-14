from flask import request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash

from backend.routes import bp
from backend.models import db, Staff

