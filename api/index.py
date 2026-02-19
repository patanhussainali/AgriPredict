from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response_data = {"message": "RAW HANDLER WORKS", "email": "debug@works.com"}
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
        return

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"RAW HANDLER GET WORKS")
        return
