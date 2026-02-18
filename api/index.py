import sys
import os

# Add BOTH the project root AND the backend folder to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(project_root, 'backend')

sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

from backend.main import app

# Vercel ASGI handler
handler = app
