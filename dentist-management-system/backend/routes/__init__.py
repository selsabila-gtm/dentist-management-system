# backend/routes/__init__.py
from flask import Blueprint

bp = Blueprint("api", __name__)

# Import modules so routes are registered
from backend.routes import staff        # noqa: F401
from backend.routes import patients     # noqa: F401
from backend.routes import appointments # noqa: F401
from backend.routes import inventory    # noqa: F401
from backend.routes import billing      # noqa: F401
from backend.routes import reports      # noqa: F401

# Keep this import if you want the file to exist (it won't register routes now)
from backend.routes import auth         # noqa: F401
