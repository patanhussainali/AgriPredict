from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for MVP, or specific ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model and Data
try:
    if os.path.exists('backend/model_objects.joblib'):
        model_data = joblib.load('backend/model_objects.joblib')
    elif os.path.exists('model_objects.joblib'):
        model_data = joblib.load('model_objects.joblib')
    else:
        # Fallback if not yet trained (handled gracefully)
        model_data = None
except Exception as e:
    print(f"Error loading model: {e}")
    model_data = None

# Load CSV for officer dashboard stats
try:
    from load_kaggle_data import load_data
    df = load_data()
    if df is None: df = pd.DataFrame()
except:
    df = pd.DataFrame()

class PredictionRequest(BaseModel):
    district: str
    crop: str
    season: str
    soil_type: str
    rainfall: float
    temp_min: float
    temp_max: float
    ph: float
    n: float
    p: float
    k: float
    lang: str = "en" # en or ta
    pulse_type: str = None # Optional, for specific pulse selection

# Simple translation dictionary for MVP
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

# ----------------- Auth & Security -----------------
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserSignup(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# ----------------- MongoDB Connection -----------------
try:
    from pymongo import MongoClient
    from datetime import datetime
    
    # Connect to local MongoDB
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["agri_predict_db"]
    sessions_collection = db["sessions"]
    predictions_collection = db["predictions"]
    users_collection = db["users"]
    
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    db = None
    sessions_collection = None
    predictions_collection = None



# ----------------- Email Verification -----------------
import uuid

class VerifyEmailRequest(BaseModel):
    token: str

@app.post("/auth/verify-email")
def verify_email_endpoint(request: VerifyEmailRequest):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    user = users_collection.find_one({"verification_token": request.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"verification_token": ""}}
    )
    
    return {"message": "Email verified successfully. You can now login."}

# ----------------- AI Chat Endpoint -----------------
class ChatRequest(BaseModel):
    message: str
    lang: str = "en"

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        try:
            from backend.utils.chat_engine import chat_bot
        except ImportError:
            import sys
            import os
            # Add parent dir to path to find 'backend' package if running from inside backend/
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from backend.utils.chat_engine import chat_bot

        response = chat_bot.get_response(request.message, request.lang)
        return {"response": response}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- User Management -----------------

@app.post("/signup")
def signup(user: UserSignup):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # Check if user already exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Generate Verification Token
    verification_token = str(uuid.uuid4())
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = datetime.now()
    user_dict["is_verified"] = False # Default to False
    user_dict["verification_token"] = verification_token
    
    users_collection.insert_one(user_dict)
    
    # Simulate sending email
    base_url = os.getenv("BASE_URL", "http://localhost:3000")
    verification_link = f"{base_url}/verify?token={verification_token}"
    print(f"------------- EMAIL VERIFICATION -------------")
    print(f"Sending verification link to: {user.email}")
    print(f"Link: {verification_link}")
    print(f"----------------------------------------------")

    return {"message": "Account created. Please verify your email.", "email": user.email}

@app.post("/login")
def login(user: UserLogin):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_record = users_collection.find_one({"email": user.email})
    if not user_record or not verify_password(user.password, user_record["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Check if verified
    # For backward compatibility with existing users (if any), treat missing is_verified as True
    # But for new robust system, we should enforce it. 
    # Let's assume all new users from now on have is_verified.
    # Existing users from previous steps might not have it.
    if user_record.get("is_verified") is False:
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")

    # Return user info (excluding password)
    return {
        "message": "Login successful",
        "user": {
            "first_name": user_record.get("first_name"),
            "last_name": user_record.get("last_name"),
            "email": user_record.get("email"),
            "role": "farmer" # Defaulting to farmer for now
        }
    }
def get_user_sessions(email: str = None):
    """
    Returns a list of active sessions for the user.
    Fetches from MongoDB 'sessions' collection.
    If empty, seeds with mock data for demonstration.
    """
    if sessions_collection is None:
        return [{"error": "Database not connected", "id": 0}]

    # Seed data if collection is empty
    if sessions_collection.count_documents({}) == 0:
        mock_sessions = [
            {
                "id": 1,
                "device": "Windows PC",
                "location": "Hyderabad, India",
                "active": True,
                "type": "desktop",
                "last_active": "Active now"
            },
            {
                "id": 2,
                "device": "iPhone 13",
                "location": "Chennai, India",
                "active": False,
                "type": "mobile",
                "last_active": "2 hours ago"
            },
            {
                 "id": 3,
                "device": "MacBook Pro",
                "location": "Bangalore, India",
                "active": False,
                "type": "desktop",
                "last_active": "Yesterday"
            }
        ]
        sessions_collection.insert_many(mock_sessions)
        print("Seeded mock sessions to MongoDB.")

    # Retrieve sessions (exclude _id for clean JSON response)
    sessions = list(sessions_collection.find({}, {"_id": 0}))
    return sessions

@app.post("/predict")
def predict_yield(data: PredictionRequest):
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_data['model']
    features = model_data['features']
    
    # ... (Pre-processing logic remains same) ...
    # Prepare input dataframe
    input_data = pd.DataFrame(0, index=[0], columns=features)
    
    # Set numeric values
    if 'rainfall' in features: input_data['rainfall'] = data.rainfall
    if 'temp_min' in features: input_data['temp_min'] = data.temp_min
    if 'temp_max' in features: input_data['temp_max'] = data.temp_max
    if 'ph' in features: input_data['ph'] = data.ph
    if 'n' in features: input_data['n'] = data.n
    if 'p' in features: input_data['p'] = data.p
    if 'k' in features: input_data['k'] = data.k
    if 'humidity' in features: input_data['humidity'] = 70.0 
        
    # Set categorical values
    district_val = data.district.upper() 
    crop_val = data.crop 
    season_val = data.season 
    soil_val = data.soil_type 
    
    # Manually check and set OHE columns
    for col, val in [('District', district_val), ('Crop', crop_val), ('Season', season_val), ('Soil_Type', soil_val)]:
        feature_name = f"{col}_{val}"
        if feature_name in features:
            input_data[feature_name] = 1
        else:
             if f"{col}_{val.upper()}" in features:
                 input_data[f"{col}_{val.upper()}"] = 1
             elif f"{col}_{val.title()}" in features:
                 input_data[f"{col}_{val.title()}"] = 1
            
    # Model Prediction
    predicted_yield = model.predict(input_data)[0]
    
    # Advisory Logic (Hybrid Rule-Based)
    advisory = []
    messages = TRANSLATIONS.get(data.lang, TRANSLATIONS["en"])
    
    risk_level = "Safe"
    risk_color = "green"
    
    # Rule 1: Yield Gap
    avg_yield = 0
    if not df.empty and 'Yield' in df.columns:
        filtered = df[(df['District'] == district_val) & (df['Crop'] == crop_val)]
        if not filtered.empty:
            avg_yield = filtered['Yield'].mean()
            
    confidence = 85.0 
    
    if avg_yield > 0 and predicted_yield < avg_yield * 0.8:
        risk_level = "High Risk"
        risk_color = "red"
        advisory.append(messages["avoid"])
    else:
        advisory.append(messages["optimal"])
        
    # Rule 2: Weather Risk
    if data.rainfall < 300 and data.crop == "Rice":
        advisory.append(messages["irrigate"])
        
    if data.n < 100:
        advisory.append(messages["fertilize"])

    # ---------------------------------------------------------
    # AI Recommendation (Groq)
    # ---------------------------------------------------------
    ai_analysis = "AI Analysis Unavailable"
    try:
        try:
            from backend.utils.chat_engine import chat_bot
        except ImportError:
            import sys
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from backend.utils.chat_engine import chat_bot
            
        ai_analysis = chat_bot.get_recommendation(data.dict())
    except Exception as e:
        print(f"AI Recommendation Failed: {e}")
        ai_analysis = "Could not generate AI analysis."

    # ----------------- MongoDB Storage -----------------
    if predictions_collection is not None:
        try:
            prediction_record = data.dict()
            prediction_record.update({
                "predicted_yield": float(predicted_yield),
                "timestamp": datetime.now(),
                "risk_level": risk_level,
                "ai_analysis": ai_analysis
            })
            predictions_collection.insert_one(prediction_record)
            print("Prediction saved to MongoDB.")
        except Exception as e:
            print(f"Failed to save prediction to MongoDB: {e}")

    return {
        "predicted_yield": round(predicted_yield, 2),
        "unit": "tons/ha",
        "confidence_score": confidence,
        "historical_average": round(avg_yield, 2),
        "risk_level": risk_level, 
        "risk_color": risk_color,
        "advisory_list": advisory,
        "ai_analysis": ai_analysis 
    }

# ----------------- Analytics Endpoints -----------------

@app.get("/analytics/datasets")
def get_datasets():
    """
    Returns a list of available datasets.
    For MVP, we only have one: the loaded Kaggle dataset.
    """
    datasets = []
    # If df is loaded, show it
    if not df.empty:
        datasets.append({
            "id": "tn_agriculture",
            "name": "Tamilnadu Agriculture Yield Data (Kaggle)",
            "description": "Historical agricultural yield data for Tamilnadu districts."
        })
    return datasets

@app.get("/analytics/data/{dataset_id}")
def get_dataset_data(dataset_id: str):
    """
    Returns the data for a specific dataset.
    """
    if dataset_id == "tn_agriculture":
        if df.empty:
            raise HTTPException(status_code=404, detail="Dataset not found or empty")
        
        # Replace NaN with None for valid JSON (FastAPI handles None as null)
        # using pandas.DataFrame.where(cond, other) -> keeps values where cond is True
        # but we need to replace NaN.
        # df.replace({np.nan: None}) is cleaner
        
        try:
            clean_df = df.replace({np.nan: None})
            return clean_df.to_dict(orient="records")
        except Exception as e:
            print(f"Error serializing data: {e}")
            raise HTTPException(status_code=500, detail="Data serialization error")
    
    raise HTTPException(status_code=404, detail="Dataset ID not found")

@app.get("/dashboard/chart-data")
def get_dashboard_chart_data(crop: str = "Rice"):
    """
    Returns historical yield data for the dashboard chart.
    Groups by Year and calculates Average Yield.
    """
    if df.empty:
        return {"labels": [], "data": []}
    
    # Filter by crop (case insensitive for robustness)
    # The CSV has 'Crop' column.
    try:
        # Create a boolean mask for the crop
        mask = df['Crop'].astype(str).str.lower() == crop.lower()
        crop_df = df[mask]
        
        if crop_df.empty:
            return {"labels": [], "data": []}
        
        # Group by Year and calculate mean Yield
        # Sort by Year to ensure chronological order
        yearly_data = crop_df.groupby('Crop_Year')['Yield'].mean().sort_index()
        
        # Format for frontend: labels (Years), data (Yields)
        return {
            "labels": yearly_data.index.astype(str).tolist(),
            "data": [round(val, 2) for val in yearly_data.values.tolist()]
        }
    except Exception as e:
        print(f"Error generating chart data: {e}")
        return {"labels": [], "data": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
