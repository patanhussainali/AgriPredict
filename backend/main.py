from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import joblib
import os
from dotenv import load_dotenv

load_dotenv()

# Check if running on Vercel
is_vercel = os.environ.get("VERCEL") == "1"
app = FastAPI(root_path="/api" if is_vercel else "")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        model_data = None
except Exception as e:
    print(f"Error loading model: {e}")
    model_data = None

# Load CSV for officer dashboard stats (List of Dicts now)
try:
    try:
        from backend.load_kaggle_data import load_data
    except ImportError:
        from load_kaggle_data import load_data
        
    csv_data = load_data() # Returns list of dicts
except Exception as e:
    print(f"Error loading Kaggle data: {e}")
    csv_data = []

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
    lang: str = "en"
    pulse_type: str = None

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
    users_collection = None


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
    
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = datetime.now()
    user_dict["is_verified"] = False
    user_dict["verification_token"] = verification_token
    
    users_collection.insert_one(user_dict)
    
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
        
    if user_record.get("is_verified") is False:
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")

    return {
        "message": "Login successful",
        "user": {
            "first_name": user_record.get("first_name"),
            "last_name": user_record.get("last_name"),
            "email": user_record.get("email"),
            "role": "farmer"
        }
    }

def get_user_sessions(email: str = None):
    if sessions_collection is None:
        return [{"error": "Database not connected", "id": 0}]

    if sessions_collection.count_documents({}) == 0:
        mock_sessions = [
            {"id": 1, "device": "Windows PC", "location": "Hyderabad, India", "active": True, "type": "desktop", "last_active": "Active now"},
            {"id": 2, "device": "iPhone 13", "location": "Chennai, India", "active": False, "type": "mobile", "last_active": "2 hours ago"},
            {"id": 3, "device": "MacBook Pro", "location": "Bangalore, India", "active": False, "type": "desktop", "last_active": "Yesterday"}
        ]
        sessions_collection.insert_many(mock_sessions)
    
    sessions = list(sessions_collection.find({}, {"_id": 0}))
    return sessions

@app.post("/predict")
def predict_yield(data: PredictionRequest):
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    model = model_data['model']
    features = model_data['features']
    
    # Create input vector (numpy array) sorted by feature order
    input_vector = np.zeros(len(features))
    
    numeric_map = {
        'rainfall': data.rainfall,
        'temp_min': data.temp_min,
        'temp_max': data.temp_max,
        'ph': data.ph,
        'n': data.n,
        'p': data.p,
        'k': data.k,
        'humidity': 70.0
    }
    
    for feat_name, val in numeric_map.items():
        if feat_name in features:
            idx = features.index(feat_name)
            input_vector[idx] = val
            
    inputs_cat = {
        'District': data.district.upper(),
        'Crop': data.crop,
        'Season': data.season,
        'Soil_Type': data.soil_type
    }
    
    for col, val in inputs_cat.items():
        candidates = [
            f"{col}_{val}",
            f"{col}_{val.upper()}",
            f"{col}_{val.title()}"
        ]
        
        for cand in candidates:
            if cand in features:
                idx = features.index(cand)
                input_vector[idx] = 1
                break
            
    try:
        predicted_yield = model.predict(input_vector.reshape(1, -1))[0]
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")
    
    advisory = []
    messages = TRANSLATIONS.get(data.lang, TRANSLATIONS["en"])
    
    risk_level = "Safe"
    risk_color = "green"
    
    # Yield Gap Logic
    avg_yield = 0
    district_val = data.district
    crop_val = data.crop
    
    filtered_yields = []
    if csv_data:
        for row in csv_data:
            d_name = row.get('District', '').strip()
            c_name = row.get('Crop', '').strip()
            y_val = row.get('Yield')
            
            if d_name.lower() == district_val.lower() and c_name.lower() == crop_val.lower():
                try:
                    filtered_yields.append(float(y_val))
                except:
                    pass
                    
        if filtered_yields:
            avg_yield = sum(filtered_yields) / len(filtered_yields)
            
    confidence = 85.0 
    
    if avg_yield > 0 and predicted_yield < avg_yield * 0.8:
        risk_level = "High Risk"
        risk_color = "red"
        advisory.append(messages["avoid"])
    else:
        advisory.append(messages["optimal"])
        
    if data.rainfall < 300 and data.crop == "Rice":
        advisory.append(messages["irrigate"])
        
    if data.n < 100:
        advisory.append(messages["fertilize"])

    # AI Recommendation
    ai_analysis = "AI Analysis Unavailable"
    try:
        try:
            from backend.utils.chat_engine import chat_bot
        except ImportError:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from backend.utils.chat_engine import chat_bot
            
        ai_analysis = chat_bot.get_recommendation(data.dict())
    except Exception as e:
        print(f"AI Recommendation Failed: {e}")
        ai_analysis = "Could not generate AI analysis."

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
        except Exception as e:
            print(f"Failed to save to MongoDB: {e}")

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

@app.get("/analytics/datasets")
def get_datasets():
    datasets = []
    if csv_data:
        datasets.append({
            "id": "tn_agriculture",
            "name": "Tamilnadu Agriculture Yield Data (Kaggle)",
            "description": "Historical agricultural yield data for Tamilnadu districts."
        })
    return datasets

@app.get("/analytics/data/{dataset_id}")
def get_dataset_data(dataset_id: str):
    if dataset_id == "tn_agriculture":
        if not csv_data:
            raise HTTPException(status_code=404, detail="Dataset not found or empty")
        return csv_data
    
    raise HTTPException(status_code=404, detail="Dataset ID not found")

@app.get("/dashboard/chart-data")
def get_dashboard_chart_data(crop: str = "Rice"):
    if not csv_data:
        return {"labels": [], "data": []}
    
    filtered = []
    for row in csv_data:
        if row.get('Crop', '').lower() == crop.lower():
            filtered.append(row)
            
    if not filtered:
        return {"labels": [], "data": []}
        
    yearly_sums = {}
    yearly_counts = {}
    
    for row in filtered:
        try:
            year = int(float(row.get('Crop_Year', 0)))
            yield_val = float(row.get('Yield', 0))
            
            if year not in yearly_sums:
                yearly_sums[year] = 0.0
                yearly_counts[year] = 0
            
            yearly_sums[year] += yield_val
            yearly_counts[year] += 1
        except:
            continue
            
    years = sorted(yearly_sums.keys())
    averages = []
    for y in years:
        avg = yearly_sums[y] / yearly_counts[y]
        averages.append(round(avg, 2))
        
    return {
        "labels": [str(y) for y in years],
        "data": averages
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
