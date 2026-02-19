from http.server import BaseHTTPRequestHandler
import json
import os

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
            
            # Active DB Check
            try:
                if backend.main.client:
                    backend.main.client.admin.command('ping')
                    result["mongo_ping"] = "Success"
                    # Try a simple find
                    count = backend.main.users_collection.count_documents({})
                    result["user_count"] = count
                    
                    # Try a WRITE operation (Insert temporary doc)
                    import uuid
                    test_email = f"test_{uuid.uuid4()}@example.com"
                    
                    # SIMULATE SIGNUP FUNCTION
                    try:
                        from backend.main import signup, UserSignup
                        user_data = UserSignup(
                            first_name="Test",
                            last_name="Probe",
                            email=test_email,
                            password="testpassword123"
                        )
                        # Call the endpoint function directly
                        signup_result = signup(user_data)
                        result["signup_logic_test"] = f"Success: {signup_result}"
                    except Exception as e:
                        result["signup_logic_test"] = f"Failed: {str(e)}"
                        
                    # Cleanup by deleting the user we just signed up
                    try:
                         backend.main.users_collection.delete_one({"email": test_email})
                         result["signup_cleanup"] = "Success"
                    except:
                         pass
                    
                else:
                    result["mongo_ping"] = "Client is None"
            except Exception as e:
                result["mongo_ping"] = f"Failed: {str(e)}"
                result["mongo_error_type"] = type(e).__name__

            # Active Auth Check (Passlib)
            try:
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
                hash = pwd_context.hash("test")
                result["auth_check"] = "Success (Passlib working)"
            except Exception as e:
                 result["auth_check"] = f"Failed: {str(e)}"
                 
        except Exception as e:
            import traceback
            result["status"] = "error"
            result["main_error"] = str(e)
            result["traceback"] = traceback.format_exc()
            
        self.wfile.write(json.dumps(result).encode('utf-8'))

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "API TEST POST WORKS", "email": "test@works.com"}).encode('utf-8'))
        return
