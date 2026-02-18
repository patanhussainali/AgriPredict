from http.server import BaseHTTPRequestHandler
import sys
import os

# Robust path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Try importing the app
try:
    from backend.main import app
    handler = app
except ImportError as e:
    print(f"Failed to import backend.main: {e}")
    # Fallback for debugging - just return error text
    def fallback_handler(request, response):
        return f"Import Error: {e}"
    handler = fallback_handler

# Verify handler is callable (FastAPI app is callable)
if not callable(handler):
    print("Warning: Handler is not callable")
