
import requests
import json

url = "http://localhost:8000/predict"
payload = {
    "district": "Ariyalur",
    "crop": "Rice",
    "season": "Kharif",
    "soil_type": "Clay",
    "rainfall": 1000,
    "temp_min": 25,
    "temp_max": 35,
    "ph": 6.5,
    "n": 120,
    "p": 40,
    "k": 40
}

try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("Success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Exception: {e}")
