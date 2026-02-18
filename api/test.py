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
            
            # Inspect Routes
            if hasattr(backend.main, "app"):
                routes = []
                for route in backend.main.app.routes:
                    if hasattr(route, "path"):
                        routes.append(route.path)
                result["registered_routes"] = routes
                result["root_path_setting"] = backend.main.app.root_path
                result["is_vercel_env"] = os.environ.get("VERCEL")
            else:
                result["registered_routes"] = "App object not found"
        except Exception as e:
            import traceback
            result["status"] = "error"
            result["import_test"] = f"Failed to import backend.main: {str(e)}"
            result["traceback"] = traceback.format_exc()
            
        self.wfile.write(json.dumps(result).encode('utf-8'))
