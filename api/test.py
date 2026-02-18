from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        result = {
            "endpoint": "api/test.py",
            "status": "checking",
            "import_test": "pending"
        }
        
        try:
            # Try to import backend.main to see if it crashes
            import backend.main
            result["status"] = "success"
            result["import_test"] = "Imported backend.main successfully"
            result["mongo_configured"] = "Yes" if backend.main.client else "No"
        except Exception as e:
            import traceback
            result["status"] = "error"
            result["import_test"] = f"Failed to import backend.main: {str(e)}"
            result["traceback"] = traceback.format_exc()
            
        self.wfile.write(json.dumps(result).encode('utf-8'))
