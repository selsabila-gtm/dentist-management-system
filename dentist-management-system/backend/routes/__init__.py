# backend/routes/__init__.py
from flask import Blueprint, send_from_directory, current_app, jsonify
import os

bp = Blueprint("api", __name__)

# Import route modules so decorators are registered
from . import auth
from . import staff
from . import patients
from . import appointments
from . import billing
from . import inventory
from . import reports

# ✅ ADD FILE SERVING ROUTE HERE IN THE BLUEPRINT
@bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    print(f"🔍 [BLUEPRINT] Requesting file: {filename}")
    print(f"📂 [BLUEPRINT] Looking in: {current_app.config['UPLOAD_FOLDER']}")
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if os.path.exists(file_path):
        print(f"✅ [BLUEPRINT] File found: {file_path}")
        return send_from_directory(
            current_app.config['UPLOAD_FOLDER'], 
            filename
        )
    else:
        print(f"❌ [BLUEPRINT] File NOT found: {file_path}")
        return jsonify({"error": "File not found", "path": file_path}), 404

@bp.route('/debug/uploads')
def debug_uploads():
    """Debug: List all files in uploads directory"""
    try:
        files = os.listdir(current_app.config['UPLOAD_FOLDER'])
        return jsonify({
            "upload_folder": current_app.config['UPLOAD_FOLDER'],
            "files": files,
            "count": len(files)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500