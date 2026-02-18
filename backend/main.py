from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# Check if running on Vercel
# Force /api root_path for Vercel deployment
is_vercel = True 
app = FastAPI(root_path="/api")

@app.get("/")
@app.get("/api/") # Fallback
def health_check():
    return {"status": "ok", "message": "AgriPredict API is running"}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model (Skipped for Vercel Demo - using Mock Logic)
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
    
    # Connect to MongoDB (Vercel or Local)
    # Check both common variable names
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://127.0.0.1:27017/"
    if mongo_uri:
        # Sanitize input: remove quotes and potential "MONGODB_URI=" prefix if user pasted incorrectly
        mongo_uri = mongo_uri.strip().strip("'").strip('"')
        if "=" in mongo_uri and "://" in mongo_uri.split("=", 1)[1]:
            # User might have pasted KEY=VALUE
            mongo_uri = mongo_uri.split("=", 1)[1].strip()
            
            # User might have pasted KEY=VALUE
            mongo_uri = mongo_uri.split("=", 1)[1].strip()
            
    # Connect with timeout to avoid Vercel 10s limit (Cold Start)
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client["agri_predict_db"]
    sessions_collection = db["sessions"]
    predictions_collection = db["predictions"]
    users_collection = db["users"]
    
    print("MongoDB Client Initialized (Lazy Connection)")
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

# Placeholder for chat_bot logic, as it's removed in the refactor snippet
def get_chat_response(message: str, lang: str):
    # This is a simplified mock based on the refactor snippet
    if "hello" in message.lower():
        return "Hello there! How can I help you with agriculture today?"
    return "I'm a simple chatbot. I can't answer complex questions yet."

# ----------------- User Management -----------------

# --- Routes moved to Router ---

@router.post("/signup")
def signup(user: UserSignup):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not connected (Init Failed)")
        
    try:
        # Check if user exists
        if users_collection.find_one({"email": user.email}):
             raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        hashed_password = get_password_hash(user.password)

        # Create user document
        user_doc = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "password": hashed_password,
            "role": "farmer", # Default role
            "is_verified": False, # implementation of email verification later
            "created_at": datetime.now()
        }
    
        result = users_collection.insert_one(user_doc)
        
        # Send Verification Email (Mock or Real)
        # For now, just return success
        return {"message": "Account created. Please verify your email.", "email": user.email}
    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail=f"Signup Error: {str(e)}")

@router.get("/db-check")
def db_check():
    try:
        if client is None:
            return {"status": "error", "message": "Client not initialized"}
        # Force a connection check
        client.admin.command('ping')
        return {"status": "ok", "message": "MongoDB connection successful!"}
    except Exception as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}

@router.post("/login")
def login(user: UserLogin):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database not connected (Init Failed)")
        
    try:
        user_record = users_collection.find_one({"email": user.email})
    except Exception as e:
        print(f"DB Error during login: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

    if not user_record or not verify_password(user.password, user_record["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if user_record.get("is_verified") is False:
        # For MVP, maybe allow login or mock verification?
        # raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")
        pass 

    return {
        "message": "Login successful",
        "user": {
            "first_name": user_record.get("first_name"),
            "last_name": user_record.get("last_name"),
            "email": user_record.get("email"),
            "role": "farmer"
        }
    }

@router.get("/auth/verify-email")
def verify_email(token: str):
    return {"message": "Email verified successfully (Mock)"}

@router.post("/auth/forgot-password")
def forgot_password(email_req: dict):
    return {"message": "Password reset link sent (Mock)"}

# --- Chat & Prediction Routes ---

@router.post("/chat")
def chat_endpoint(request: ChatRequest):
    response = get_chat_response(request.message, request.lang)
    return {"response": response}

@router.post("/predict")
def predict_endpoint(request: PredictionRequest):
    # Mock Prediction for MVP/Vercel Bundle Size constraints
    # In real app, load model.pkl
    import random
    
    mock_yield = random.uniform(1.5, 8.0) # tons/hectare
    
    return {
        "predicted_yield": round(mock_yield, 2),
        "unit": "tons/hectare",
        "advisory": f"Conditions look good for {request.crop}. Maintain soil moisture."
    }

# --- Analytics Routes ---
@router.get("/analytics/datasets")
def get_datasets():
    # Return list of available datasets (Mock or from DB)
    return [
        {"id": "cropyield2024", "name": "Crop Yield 2024", "description": "Global crop yield data"},
        {"id": "soilhealth", "name": "Soil Health Index", "description": "Regional soil quality metrics"}
    ]

@router.get("/analytics/data/{dataset_id}")
def get_dataset_data(dataset_id: str):
    # Mock data for charts
    return {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
        "values": [12, 19, 3, 5, 2]
    }
    
@router.get("/dashboard/chart-data")
def get_dashboard_chart_data(crop: str = "Rice"):
    # Mock data based on crop
    import random
    return {
        "labels": ["2020", "2021", "2022", "2023", "2024"],
        "yields": [random.uniform(2,5) for _ in range(5)],
        "rainfall": [random.uniform(800,1200) for _ in range(5)]
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

    
    # Adjust based on Soil
    soil_factor = 1.1 if data.soil_type in ["Clay", "Loam"] else 0.9
    
    # Calculate Prediction
    predicted_yield = base_yield * rainfall_factor * soil_factor
    
    # Add some randomness to make it look realistic
    import random
    predicted_yield = predicted_yield * random.uniform(0.9, 1.1)

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
