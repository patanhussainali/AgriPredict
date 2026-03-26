from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import random
import joblib
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from groq import Groq

# Load .env from ROOT directory (one level up)
load_dotenv(dotenv_path="../.env")

# Initialize FastAPI
app = FastAPI()

# CORS - Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Loading Logic ---
MODEL_PATH = "model_objects.joblib"
if os.path.exists("backend/model_objects.joblib"):
    MODEL_PATH = "backend/model_objects.joblib"

model_data = None
try:
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        print(f"✅ Machine Learning Model Loaded Successfully from {MODEL_PATH}")
    else:
        print(f"⚠️ Model file not found at {MODEL_PATH}. Prediction will use mock data.")
except Exception as e:
    print(f"❌ Failed to load model: {e}")

# --- Initialize Groq Client ---
api_key = os.getenv("GROQ_API_KEY")
client = None

if api_key:
    try:
        client = Groq(api_key=api_key)
        print("✅ Groq Client Initialized Successfully")
    except Exception as e:
        print(f"❌ Groq Init Failed: {e}")
else:
    print("⚠️ No GROQ_API_KEY found in .env")

@app.get("/")
def home():
    return {
        "status": "AgriPredict Backend Running", 
        "ai_enabled": client is not None,
        "model_loaded": model_data is not None
    }

@app.get("/predict")
def predict(
    district: str,
    crop: str,
    season: str,
    rainfall: float = 0.0,
    temp_min: float = 0.0,
    temp_max: float = 0.0,
    ph: float = 6.5,
    n: float = 140.0,
    p: float = 50.0,
    k: float = 50.0,
    soil_type: str = "Clay Loam",
    lang: str = "en",
    pulse_type: str = ""
):
    """
    Crop Yield Prediction Endpoint
    """
    print(f"Prediction Request: {crop} in {district} ({season})")
    
    # CASE: Model not loaded (Fallback)
    if not model_data:
        # Mock logic to avoid 404/500 errors if model file is missing
        base_yield = random.uniform(1.5, 4.5)
        return {
            "prediction": round(base_yield, 2),
            "unit": "tonnes/hectare",
            "status": "mock_success",
            "message": "Model not available locally; providing heuristic prediction."
        }

    try:
        # 1. Prepare Input Dataframe (Raw)
        input_raw = pd.DataFrame([{
            "District": district,
            "Crop": crop if crop != 'Pulses' else pulse_type,
            "Season": season,
            "Soil_Type": soil_type,
            "Rainfall": rainfall,
            "Temp_Min": temp_min,
            "Temp_Max": temp_max,
            "pH": ph,
            "N": n,
            "P": p,
            "K": k
        }])

        # 2. Vectorize inputs to match model training features
        # Training used pd.get_dummies(X, columns=['District', 'Crop', 'Season', 'Soil_Type'])
        input_encoded = pd.get_dummies(input_raw, columns=['District', 'Crop', 'Season', 'Soil_Type'])
        
        # 3. Align Columns with Training Data
        features = model_data['features']
        X_predict = pd.DataFrame(0, index=[0], columns=features)

        # Fill available encoded columns
        for col in input_encoded.columns:
            if col in X_predict.columns:
                X_predict[col] = input_encoded[col].values

        # 4. Predict
        model = model_data['model']
        prediction = model.predict(X_predict)[0]

        return {
            "prediction": round(float(prediction), 2),
            "unit": "tonnes/hectare",
            "status": "success"
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        return {
            "prediction": 0,
            "status": "error",
            "message": str(e)
        }

@app.get("/chat")
def chat(message: str, lang: str = "en"):
    """
    Chat endpoint using Real Groq AI
    """
    print(f"Received message: {message} ({lang})")
    
    if not client:
        return {
            "response": "⚠️ System Error: AI Service is not configured (Missing API Key).",
            "lang": lang,
            "status": "error"
        }

    try:
        # Prompt Engineering for Agri Assistant
        system_prompt = (
            f"You are an expert Agricultural Assistant. Answer in {lang} language. "
            "Keep answers concise, helpful, and focused on farming, crops, and weather. "
            "If asked about prices, give general estimates."
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model="llama-3.3-70b-versatile", # Updated to supported model
            temperature=0.7,
            max_tokens=200,
        )

        reply = chat_completion.choices[0].message.content
        return {
            "response": reply,
            "lang": lang,
            "status": "success"
        }

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "response": f"Error: {str(e)}", # Show actual error for debugging
            "lang": lang,
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    # Vercel likes port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
