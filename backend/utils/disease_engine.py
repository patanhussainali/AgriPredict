"""
Plant Disease Detection Engine
Uses Groq's vision-capable LLM to analyze plant images and provide
comprehensive disease diagnosis with treatment recommendations.
"""
import os
import base64
import json
from groq import Groq
from dotenv import load_dotenv

# Load from root .env regardless of working directory
_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(os.path.dirname(_dir))  # backend/utils -> backend -> root
load_dotenv(dotenv_path=os.path.join(_root, ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(_dir), ".env"))  # also try backend/../.env
load_dotenv(dotenv_path="../.env")  # fallback

# Disease knowledge base for severity mapping and treatment lookup
DISEASE_KNOWLEDGE = {
    "late blight": {
        "severity_keywords": ["severe", "widespread", "extensive"],
        "pesticides": ["Mancozeb 75% WP", "Chlorothalonil", "Metalaxyl + Mancozeb"],
        "prevention": "Avoid overhead irrigation. Use certified disease-free seeds. Rotate crops every 2-3 years.",
        "crop_advice": "Remove and destroy infected plant parts immediately. Apply fungicide at first sign of infection."
    },
    "early blight": {
        "severity_keywords": ["moderate", "early stage"],
        "pesticides": ["Copper Oxychloride", "Mancozeb", "Azoxystrobin"],
        "prevention": "Maintain proper plant spacing for air circulation. Avoid wetting foliage.",
        "crop_advice": "Apply fungicide preventively during humid weather. Remove lower infected leaves."
    },
    "powdery mildew": {
        "severity_keywords": ["white powder", "coating"],
        "pesticides": ["Sulfur 80% WP", "Hexaconazole", "Propiconazole"],
        "prevention": "Plant resistant varieties. Ensure good air circulation. Avoid excess nitrogen fertilizer.",
        "crop_advice": "Apply sulfur-based fungicide. Avoid overhead watering in evenings."
    },
    "leaf rust": {
        "severity_keywords": ["rust", "orange", "pustules"],
        "pesticides": ["Propiconazole 25% EC", "Tebuconazole", "Trifloxystrobin"],
        "prevention": "Use rust-resistant varieties. Apply preventive fungicide during high-risk periods.",
        "crop_advice": "Scout fields regularly. Apply fungicide at first sign of rust pustules."
    },
    "bacterial blight": {
        "severity_keywords": ["water-soaked", "yellowing", "wilting"],
        "pesticides": ["Copper Hydroxide", "Streptomycin Sulfate", "Kasugamycin"],
        "prevention": "Use disease-free seeds. Avoid working in wet fields. Disinfect tools.",
        "crop_advice": "No effective cure once established. Remove infected plants. Apply copper-based bactericide."
    },
    "healthy": {
        "severity_keywords": [],
        "pesticides": [],
        "prevention": "Continue current good agricultural practices.",
        "crop_advice": "Plant appears healthy. Maintain regular monitoring and preventive care."
    }
}


class DiseaseEngine:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                print(f"DiseaseEngine: Groq Client Initialized (key: ...{self.api_key[-6:]})")
            except Exception as e:
                print(f"DiseaseEngine: Failed to initialize Groq: {e}")
        else:
            print("DiseaseEngine: WARNING - GROQ_API_KEY not found in environment")

    def encode_image(self, image_bytes: bytes) -> str:
        """Encode image bytes to base64 string."""
        return base64.b64encode(image_bytes).decode("utf-8")

    def analyze_disease(self, image_bytes: bytes, crop_name: str = "", lang: str = "en") -> dict:
        """
        Analyze plant image for disease detection.
        Returns structured diagnosis with treatment recommendations.
        """
        if not self.client:
            return self._fallback_response(crop_name)

        try:
            b64_image = self.encode_image(image_bytes)

            lang_instruction = ""
            if lang == "ta":
                lang_instruction = "Provide the final farmer_advice field in Tamil language. Keep all other fields in English."
            elif lang == "hi":
                lang_instruction = "Provide the final farmer_advice field in Hindi language. Keep all other fields in English."
            elif lang == "te":
                lang_instruction = "Provide the final farmer_advice field in Telugu language. Keep all other fields in English."
            elif lang == "kn":
                lang_instruction = "Provide the final farmer_advice field in Kannada language. Keep all other fields in English."

            crop_context = f"The farmer says this is a {crop_name} plant. " if crop_name else ""

            prompt = f"""You are an expert plant pathologist and agricultural scientist. {crop_context}
Analyze this plant image carefully and provide a detailed disease diagnosis.

{lang_instruction}

Respond ONLY with a valid JSON object in this exact format:
{{
  "disease_name": "Name of the disease or 'Healthy Plant' if no disease found",
  "confidence": 87,
  "severity": "Mild | Moderate | Severe | Healthy",
  "severity_percentage": 25,
  "affected_parts": "Leaves, Stem, etc.",
  "symptoms_observed": "Brief description of visible symptoms",
  "possible_causes": "Fungal / Bacterial / Viral / Environmental",
  "recommended_pesticides": ["Pesticide 1 (dosage)", "Pesticide 2 (dosage)"],
  "organic_treatment": "Organic/natural treatment option",
  "preventive_measures": ["Measure 1", "Measure 2", "Measure 3"],
  "crop_protection_advice": "Specific advice for protecting the crop",
  "yield_impact": "Estimated yield impact if untreated (e.g., 20-40% loss)",
  "urgency": "Immediate | Within 3 days | Within a week | Monitor only",
  "farmer_advice": "Simple, friendly advice for the farmer in plain language"
}}

Be accurate and practical. If the image is unclear or not a plant, set disease_name to 'Unable to analyze' and confidence to 0."""

            # Try vision-capable models in order of preference
            vision_models = [
                "meta-llama/llama-4-scout-17b-16e-instruct",
                "llama-4-scout-17b-16e-instruct",
                "llava-v1.5-7b-4096-preview",
            ]

            response = None
            last_error = None
            for model_id in vision_models:
                try:
                    response = self.client.chat.completions.create(
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{b64_image}"
                                        }
                                    },
                                    {
                                        "type": "text",
                                        "text": prompt
                                    }
                                ]
                            }
                        ],
                        model=model_id,
                        temperature=0.3,
                        max_tokens=1024,
                    )
                    print(f"DiseaseEngine: Using vision model {model_id}")
                    break
                except Exception as model_err:
                    print(f"DiseaseEngine: Model {model_id} failed: {model_err}")
                    last_error = model_err
                    continue

            if response is None:
                print(f"DiseaseEngine: All vision models failed, using text fallback. Last error: {last_error}")
                return self._text_fallback(crop_name, lang)

            raw = response.choices[0].message.content.strip()

            # Extract JSON from response
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            result = json.loads(raw)
            result["status"] = "success"
            result["model_used"] = "llama-4-scout-17b (vision)"
            return result

        except json.JSONDecodeError as e:
            print(f"DiseaseEngine JSON parse error: {e}")
            return self._fallback_response(crop_name, error="AI response parsing failed")
        except Exception as e:
            print(f"DiseaseEngine analysis error: {e}")
            # Try text-only fallback if vision model fails
            return self._text_fallback(crop_name, lang)

    def _text_fallback(self, crop_name: str, lang: str = "en") -> dict:
        """Fallback using text-only model when vision fails."""
        if not self.client:
            return self._fallback_response(crop_name)
        try:
            crop_context = crop_name or "unknown crop"
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a plant disease expert. Respond only with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": f"""The farmer uploaded an image of a {crop_context} plant for disease analysis.
Since image analysis is unavailable, provide a general disease risk assessment for {crop_context}.
Return JSON with: disease_name, confidence (set to 50), severity, severity_percentage, affected_parts,
symptoms_observed, possible_causes, recommended_pesticides (array), organic_treatment,
preventive_measures (array), crop_protection_advice, yield_impact, urgency, farmer_advice."""
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.4,
                max_tokens=800,
            )
            raw = response.choices[0].message.content.strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            result = json.loads(raw)
            result["status"] = "partial"
            result["model_used"] = "text-only fallback"
            result["note"] = "Image analysis unavailable. General assessment provided."
            return result
        except Exception as e:
            print(f"Text fallback also failed: {e}")
            return self._fallback_response(crop_name)

    def _fallback_response(self, crop_name: str = "", error: str = "") -> dict:
        """Static fallback when all AI services fail."""
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
            "farmer_advice": "We could not analyze your image at this time. Please try again or contact your local agricultural officer.",
            "status": "error",
            "error": error or "AI service unavailable",
            "model_used": "none"
        }
