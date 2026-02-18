from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Dump env vars (safe ones) and request path
        env_dump = {k: v for k, v in os.environ.items() if k.startswith("VERCEL") or k in ["AWS_LAMBDA_FUNCTION_NAME", "PYTHONPATH"]}
        
        response = {
            "message": "Hello from api/debug.py!",
            "status": "success",
            "env": env_dump,
            "path": self.path
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
