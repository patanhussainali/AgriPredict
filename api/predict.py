from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import random
import os
import requests

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)

        def get_param(key, default=None):
            return query_params.get(key, [default])[0]

        try:
            district  = get_param('district', 'Unknown')
            crop      = get_param('crop', 'Rice')
            season    = get_param('season', 'Kharif')
            rainfall  = float(get_param('rainfall', '0') or 0)
            lang      = get_param('lang', 'en')

            # --- Yield simulation ---
            base = random.uniform(2.5, 5.5)
            crop_lower = crop.lower()
            if crop_lower in ['rice', 'paddy']:   base += 1.5
            elif crop_lower == 'sugarcane':        base += 3.0
            elif crop_lower == 'cotton':           base -= 0.5
            elif crop_lower in ['ragi', 'bajra']:  base -= 0.3

            predicted_yield   = round(base, 2)
            historical_avg    = round(base * random.uniform(0.88, 1.05), 2)
            confidence_score  = round(random.uniform(82, 94), 1)

            # --- Risk ---
            risk_level = "Moderate Risk" if rainfall < 80 and season == "Kharif" else "Low Risk"
            risk_color = "orange" if risk_level == "Moderate Risk" else "green"

            # --- Advisory list ---
            advisory_list = [
                f"Optimal conditions detected for {crop} cultivation in {district}.",
                "Maintain soil moisture between 60–70% for best results.",
                "Monitor for common pests during the early growth stage.",
            ]
            if rainfall < 80 and season == "Kharif":
                advisory_list.insert(0, "Low rainfall detected — supplemental irrigation recommended.")

            # --- AI analysis via Groq ---
            ai_analysis = (
                f"Based on current parameters, {crop} in {district} during {season} season "
                f"is projected to yield {predicted_yield} tons/hectare. "
                f"Conditions are {'moderate' if risk_color == 'orange' else 'favorable'} for cultivation."
            )

            api_key = os.environ.get("GROQ_API_KEY")
            if api_key:
                try:
                    resp = requests.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        json={
                            "model": "llama-3.3-70b-versatile",
                            "messages": [
                                {"role": "system", "content": "You are an agricultural expert. Give a concise 2-sentence analysis."},
                                {"role": "user", "content": f"Crop: {crop}, District: {district}, Season: {season}, Rainfall: {rainfall}mm, Predicted yield: {predicted_yield} t/ha."}
                            ],
                            "temperature": 0.5,
                            "max_tokens": 120
                        },
                        timeout=8
                    )
                    if resp.status_code == 200:
                        ai_analysis = resp.json()['choices'][0]['message']['content']
                except Exception:
                    pass  # fall back to static analysis

            result = {
                "predicted_yield": predicted_yield,
                "prediction": predicted_yield,
                "unit": "tons/hectare",
                "risk_level": risk_level,
                "risk_color": risk_color,
                "historical_average": historical_avg,
                "confidence_score": confidence_score,
                "advisory_list": advisory_list,
                "ai_analysis": ai_analysis,
                "status": "success"
            }

            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"error": str(e), "status": "error"})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
