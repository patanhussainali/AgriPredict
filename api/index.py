import sys
import os

# Add the project root to the path so we can import from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Vercel needs the handler to be named 'handler' or the app exported as 'app'
# FastAPI/Starlette apps work as ASGI apps directly with Vercel
handler = app
