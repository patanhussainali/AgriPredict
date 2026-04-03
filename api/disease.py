"""
Vercel Serverless Function: Plant Disease Detection
POST /api/disease - Accepts multipart form with image file
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import cgi
import io
import requests


def analyze_with_groq(image_b64: str, crop_name: str, lang: str) -> dict:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return _fallback_response("GROQ_API_KEY not configured")

    lang_instruction = ""
    if lang == "ta":
        lang_instruction = "Provide the farmer_advice field in Tamil. Keep all other fields in English."
    elif lang == "hi":
        lang_instruction = "Provide the farmer_advice field in Hindi. Keep all other fields in English."
    elif lang == "te":
        lang_instruction = "Provide the farmer_advice field in Telugu. Keep all other fields in English."
    elif lang == "kn":
        lang_instruction = "Provide the farmer_advice field in Kannada. Keep all other fields in English."

    crop_context = f"The farmer says this is a {crop_name} plant. " if crop_name else ""

    prompt = f"""You are an expert plant pathologist. {crop_context}
Analyze this plant image and provide disease diagnosis.
{lang_instruction}

Respond ONLY with valid JSON:
{{
  "disease_name": "Disease name or 'Healthy Plant'",
  "confidence": 87,
  "severity": "Mild | Moderate | Severe | Healthy",
  "severity_percentage": 25,
  "affected_parts": "Leaves, Stem, etc.",
  "symptoms_observed": "Visible symptoms description",
  "possible_causes": "Fungal / Bacterial / Viral / Environmental",
  "recommended_pesticides": ["Pesticide 1 (dosage)", "Pesticide 2 (dosage)"],
  "organic_treatment": "Organic treatment option",
  "preventive_measures": ["Measure 1", "Measure 2", "Measure 3"],
  "crop_protection_advice": "Crop protection advice",
  "yield_impact": "Estimated yield impact if untreated",
  "urgency": "Immediate | Within 3 days | Within a week | Monitor only",
  "farmer_advice": "Simple friendly advice for the farmer"
}}"""

    vision_models = [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-4-scout-17b-16e-instruct",
        "llava-v1.5-7b-4096-preview",
    ]

    raw_content = None
    for model_id in vision_models:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model_id,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                            {"type": "text", "text": prompt}
                        ]
                    }],
                    "temperature": 0.3,
                    "max_tokens": 1024
                },
                timeout=30
            )
            if resp.status_code == 200:
                raw_content = resp.json()["choices"][0]["message"]["content"].strip()
                print(f"Vision model {model_id} succeeded")
                break
            print(f"Model {model_id} returned HTTP {resp.status_code}")
        except Exception as e:
            print(f"Model {model_id} exception: {e}")
            continue

    if raw_content is None:
        return _fallback_response("All vision models unavailable")

    try:
        if "```json" in raw_content:
            raw_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            raw_content = raw_content.split("```")[1].split("```")[0].strip()
        result = json.loads(raw_content)
        result["status"] = "success"
        return result
    except json.JSONDecodeError:
        return _fallback_response("Response parsing failed")


def _fallback_response(error: str = "") -> dict:
    return {
        "disease_name": "Analysis Unavailable",
        "confidence": 0,
        "severity": "Unknown",
        "severity_percentage": 0,
        "affected_parts": "N/A",
        "symptoms_observed": "Could not analyze the image.",
        "possible_causes": "N/A",
        "recommended_pesticides": ["Consult local agricultural officer"],
        "organic_treatment": "Consult local agricultural officer",
        "preventive_measures": [
            "Maintain proper crop spacing",
            "Use certified disease-free seeds",
            "Practice crop rotation"
        ],
        "crop_protection_advice": "Please consult your local Krishi Vigyan Kendra (KVK) for expert advice.",
        "yield_impact": "Unknown",
        "urgency": "Consult expert",
        "farmer_advice": "We could not analyze your image. Please try again or contact your local agricultural officer.",
        "status": "error",
        "error": error,
        "model_used": "none"
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # Parse multipart form data
            environ = {
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": content_type,
                "CONTENT_LENGTH": str(content_length),
            }

            form = cgi.FieldStorage(
                fp=io.BytesIO(body),
                headers=self.headers,
                environ=environ
            )

            # Extract fields
            crop_name = form.getvalue("crop_name", "")
            lang = form.getvalue("lang", "en")

            image_field = form["image"] if "image" in form else None
            if not image_field or not hasattr(image_field, "file"):
                self._send_json(400, {"status": "error", "farmer_advice": "No image provided.", "confidence": 0})
                return

            image_bytes = image_field.file.read()
            if len(image_bytes) > 10 * 1024 * 1024:
                self._send_json(400, {"status": "error", "farmer_advice": "Image too large (max 10MB).", "confidence": 0})
                return

            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            result = analyze_with_groq(image_b64, crop_name, lang)
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"status": "error", "farmer_advice": f"Server error: {str(e)}", "confidence": 0})

    def do_OPTIONS(self):
        self.send_response(200)
        self._add_cors_headers()
        self.end_headers()

    def _add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._add_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
