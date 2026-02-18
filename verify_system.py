import requests
import json
import os
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = f"test_user_{int(datetime.now().timestamp())}@example.com"
TEST_PASS = "password123"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def check_health():
    try:
        # FastAPI docs is a good proxy for health
        r = requests.get(f"{BASE_URL}/docs")
        if r.status_code == 200:
            log("Backend is UP", "PASS")
            return True
        else:
            log(f"Backend returned {r.status_code}", "FAIL")
            return False
    except Exception as e:
        log(f"Backend connection failed: {e}", "FAIL")
        return False

def test_signup():
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": TEST_EMAIL,
        "password": TEST_PASS
    }
    try:
        r = requests.post(f"{BASE_URL}/signup", json=payload)
        if r.status_code == 200:
            log("Signup Successful", "PASS")
            return True
        else:
            log(f"Signup Failed: {r.text}", "FAIL")
            return False
    except Exception as e:
        log(f"Signup Error: {e}", "FAIL")
        return False

def test_login_unverified():
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASS
    }
    try:
        r = requests.post(f"{BASE_URL}/login", json=payload)
        if r.status_code == 403:
             log("Login blocked for unverified user (Expected)", "PASS")
             return True
        elif r.status_code == 200:
             log("Login allowed for unverified user (UNEXPECTED)", "FAIL")
             return False
        else:
             log(f"Login Unverified Failed with {r.status_code}: {r.text}", "FAIL")
             return False
    except Exception as e:
        log(f"Login Unverified Error: {e}", "FAIL")
        return False

# Need manual verification simulation or backend backdoor for robust testing without email
# For now, we will assume manual verification is needed unless we hack the DB directly in this script.
# Since this script runs locally, we can connect to Mongo directly to verify the user.

def verify_user_in_db():
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://127.0.0.1:27017/")
        db = client["agri_predict_db"]
        users = db["users"]
        result = users.update_one({"email": TEST_EMAIL}, {"$set": {"is_verified": True}})
        if result.modified_count > 0:
            log("Manually verified user in DB", "PASS")
            return True
        else:
            log("Could not find user in DB to verify", "FAIL")
            return False
    except Exception as e:
        log(f"DB Direct Access Error: {e}", "FAIL")
        return False

def test_login_verified():
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASS
    }
    try:
        r = requests.post(f"{BASE_URL}/login", json=payload)
        if r.status_code == 200:
             log("Login Verified Successful", "PASS")
             return True
        else:
             log(f"Login Verified Failed: {r.text}", "FAIL")
             return False
    except Exception as e:
        log(f"Login Verified Error: {e}", "FAIL")
        return False

def test_prediction():
    payload = {
        "district": "COIMBATORE",
        "crop": "Rice",
        "season": "Kharif",
        "soil_type": "Clay",
        "rainfall": 1200.0,
        "temp_min": 22.0,
        "temp_max": 32.0,
        "ph": 6.5,
        "n": 120.0,
        "p": 40.0,
        "k": 20.0,
        "lang": "en"
    }
    try:
        r = requests.post(f"{BASE_URL}/predict", json=payload)
        if r.status_code == 200:
            data = r.json()
            if "predicted_yield" in data:
                log(f"Prediction Successful: {data['predicted_yield']} {data['unit']}", "PASS")
                return True
            else:
                log("Prediction response missing data", "FAIL")
                return False
        else:
            log(f"Prediction Failed: {r.text}", "FAIL")
            return False
    except Exception as e:
        log(f"Prediction Error: {e}", "FAIL")
        return False

def test_chat():
    payload = {
        "message": "What is the best fertilizer for rice?",
        "lang": "en"
    }
    try:
        r = requests.post(f"{BASE_URL}/chat", json=payload)
        if r.status_code == 200:
            data = r.json()
            if "response" in data and len(data["response"]) > 0:
                log("AI Chat Successful", "PASS")
                return True
            else:
                 log(f"AI Chat Empty Response: {data}", "FAIL")
                 return False
        else:
             log(f"AI Chat Failed: {r.text}", "FAIL")
             return False
    except Exception as e:
        log(f"AI Chat Error: {e}", "FAIL")
        return False

def main():
    print("=== STARTING FULL SYSTEM VERIFICATION ===")
    
    if not check_health():
        print("\nCRITICAL: Backend is not running. Please run 'python backend/main.py'")
        return

    print("\n--- Authentication Flow ---")
    if test_signup():
        test_login_unverified()
        if verify_user_in_db():
            test_login_verified()
    
    print("\n--- Core Features ---")
    test_prediction()
    test_chat()
    
    print("\n=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    main()
