from flask import Blueprint

bp = Blueprint("api", __name__)

# import route modules so decorators are registered
from . import auth
from . import staff
from . import patients
from . import appointments
from . import billing
from . import inventory
from . import reports
