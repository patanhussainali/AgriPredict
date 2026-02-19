from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import random

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        message = query_params.get('message', [''])[0]
        lang = query_params.get('lang', ['en'])[0]
        
        # MOCK CHAT LOGIC
        responses = [
            "That's a great question about farming.",
            "Based on the weather, I suggest monitoring soil moisture.",
            "For pest control, consider organic neem oil.",
            "Crop rotation is key for soil health.",
            "Make sure to check the market prices before harvesting."
        ]
        
        reply = random.choice(responses)
        if message:
            reply = f"Regarding '{message}': {reply}"
            
        result = {
            "response": reply,
            "lang": lang,
            "status": "success"
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode('utf-8'))

    def do_POST(self):
        # Allow POST mock
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"response": "Chat POST Works (Mock)", "status": "success"}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
