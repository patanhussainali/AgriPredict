from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import random

# Mock Translations
TRANSLATIONS = {
    "en": {
        "irrigate": "Irrigate immediately",
        "fertilize": "Apply Nitrogen fertilizer",
        "risk_high": "High Risk",
        "risk_safe": "Safe",
        "optimal": "Optimal sowing window",
        "avoid": "Avoid sowing now due to weather",
    },
    "ta": {
        "irrigate": "உடனடியாக தண்ணீர் பாய்ச்சவும்",
        "fertilize": "நைட்ரஜன் உரம் இடவும்",
        "risk_high": "அதிக ஆபத்து",
        "risk_safe": "பாதுகாப்பான நிலை",
        "optimal": "விதைப்பதற்கு ஏற்ற காலம்",
        "avoid": "வானிலை காரணமாக விதைப்பதைத் தவிர்க்கவும்",
    }
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query parameters
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        # Helper to get single value
        def get_param(key, default=None):
            return query_params.get(key, [default])[0]

        try:
            # Extract inputs
            district = get_param('district', 'Unknown')
            crop = get_param('crop', 'Unknown')
            lang = get_param('lang', 'en')
            
            # --- MOCK PREDICTION LOGIC ---
            # In a real scenario without DB, we would load model.pkl here.
            # For Vercel Free Tier stability, we use advanced mock logic.
            
            # Simulated Yield (tons/hectare)
            base_yield = random.uniform(2.5, 6.0)
            if crop.lower() in ['rice', 'paddy']:
                base_yield += 1.5
            elif crop.lower() in ['cotton']:
                base_yield -= 1.0
                
            predicted_yield = round(base_yield, 2)
            
            # Simulated Advisory
            advisory_key = "risk_safe"
            if random.random() > 0.8:
                advisory_key = "risk_high"
                
            advisory_msg = TRANSLATIONS.get(lang, TRANSLATIONS['en']).get(advisory_key, "Safe")
            custom_advisory = f"{advisory_msg}. Ideal conditions for {crop} in {district}."

            result = {
                "predicted_yield": predicted_yield,
                "unit": "tons/hectare",
                "risk_level": "Low" if advisory_key == "risk_safe" else "High",
                "confidence": 85.5,
                "advisory": custom_advisory,
                "status": "success"
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
             self.send_response(500)
             self.send_header('Content-type', 'application/json')
             self.send_header('Access-Control-Allow-Origin', '*')
             self.end_headers()
             self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_POST(self):
        # Fallback to allow POST if it magically works, or return 405 handled nicely
        self.do_GET() # Treat POST as GET if possible (ignoring body)? No, better to send explicit JSON
        # Actually, let's try to parse body if possible, or just mock return
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "POST Accepted (Mock)", "status": "success"}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
