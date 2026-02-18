from http.server import BaseHTTPRequestHandler
import sys
import os
import json

# Robust path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Try importing the app
try:
    from backend.main import app
    handler = app
except Exception as e:
    # Error Handler
    error_msg = f"Import Error: {str(e)}"
    print(error_msg)
    
    # Return a dummy handler that returns JSON error
    async def fallback_handler(scope, receive, send):
        if scope['type'] == 'http':
            response_body = json.dumps({
                "error": "Server Init Error", 
                "detail": error_msg,
                "path": sys.path,
                "cwd": os.getcwd()
            }).encode('utf-8')
            
            await send({
                'type': 'http.response.start',
                'status': 500,
                'headers': [
                    [b'content-type', b'application/json'],
                ],
            })
            await send({
                'type': 'http.response.body',
                'body': response_body,
            })
    
    handler = fallback_handler
