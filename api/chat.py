from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import os
import requests

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query parameters
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        user_message = query_params.get('message', [''])[0]
        lang = query_params.get('lang', ['en'])[0]
        
        # 1. Check for API Key
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            self.send_error_response(500, "GROQ_API_KEY is not configured in Vercel environment variables.")
            return

        if not user_message:
            self.send_error_response(400, "Message parameter is required.")
            return

        try:
            # 2. Call Groq API via requests (standard for Vercel Python functions)
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # System prompt for agricultural context
            system_prompt = "You are an expert agricultural assistant. Provide concise, helpful advice in " + ("Tamil" if lang == 'ta' else "English") + "."
            
            payload = {
                "model": "mixtral-8x7b-32768",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.7,
                "max_tokens": 512
            }

            response = requests.post(url, headers=headers, json=payload, timeout=10)
            
            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', 'Groq API Error')
                self.send_error_response(response.status_code, f"Groq API Error: {error_msg}")
                return

            data = response.json()
            reply = data['choices'][0]['message']['content']
            
            self.send_success_response({"response": reply, "status": "success"})

        except Exception as e:
            self.send_error_response(500, f"Server Error: {str(e)}")

    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message, "status": "error"}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
