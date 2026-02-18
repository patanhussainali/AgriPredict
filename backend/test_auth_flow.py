import requests
import random
import string
import sys

BASE_URL = "http://127.0.0.1:8000"

def generate_random_email():
    return "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.com"

def test_signup_and_login():
    email = generate_random_email()
    password = "SecurePassword123!"
    first_name = "Test"
    last_name = "User"

    print(f"Testing with Email: {email}")

    # 1. Test Signup
    signup_payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "password": password
    }
    
    print("\n[1] Testing Signup...")
    try:
        response = requests.post(f"{BASE_URL}/signup", json=signup_payload)
        if response.status_code == 200:
            print("✅ Signup Successful")
        else:
            print(f"❌ Signup Failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

    # 2. Test Duplicate Signup
    print("\n[2] Testing Duplicate Signup (should fail)...")
    response = requests.post(f"{BASE_URL}/signup", json=signup_payload)
    if response.status_code == 400:
        print("✅ Duplicate Signup Blocked (Correctly)")
    else:
        print(f"❌ Duplicate Signup NOT Blocked: {response.status_code}")

    # 3. Test Login with WRONG Password
    print("\n[3] Testing Login with WRONG Password...")
    login_payload_wrong = {
        "email": email,
        "password": "WrongPassword"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_payload_wrong)
    if response.status_code == 401:
         print("✅ Login with Wrong Password Blocked (Correctly)")
    else:
         print(f"❌ Wrong Password Login Allowed: {response.status_code}")

    # 4. Test Login with CORRECT Password
    print("\n[4] Testing Login with CORRECT Password...")
    login_payload_correct = {
        "email": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/login", json=login_payload_correct)
    if response.status_code == 200:
        data = response.json()
        if "user" in data and data["user"]["email"] == email:
             print("✅ Login Successful & User Data Verified")
             print(f"   User Role: {data['user'].get('role')}")
        else:
             print("❌ Login Succeeded but User Data Invalid")
    else:
        print(f"❌ Login Failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    try:
        import requests
        test_signup_and_login()
    except ImportError:
        print("Requests library not found. Please install it: pip install requests")
