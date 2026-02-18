import pymongo
from pprint import pprint

def view_data():
    try:
        # Connect to local MongoDB
        client = pymongo.MongoClient("mongodb://127.0.0.1:27017/")
        db = client["agri_predict_db"]
        
        print("="*40)
        print(f"DATABASE: {db.name}")
        print("="*40)

        # 1. Users Collection
        users = list(db.users.find({}, {"_id": 0, "password": 0})) # Hide password hashes
        print(f"\n[Users Collection] ({len(users)} records)")
        if users:
            pprint(users)
        else:
            print("No users found.")

        # 2. Predictions Collection
        predictions = list(db.predictions.find({}, {"_id": 0}).limit(5)) # Show last 5
        print(f"\n[Predictions Collection] (Showing last 5)")
        if predictions:
            pprint(predictions)
        else:
            print("No predictions found.")

        # 3. Sessions Collection
        sessions = list(db.sessions.find({}, {"_id": 0}))
        print(f"\n[Sessions Collection] ({len(sessions)} records)")
        if sessions:
            pprint(sessions)
        else:
            print("No active sessions found.")

    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

if __name__ == "__main__":
    view_data()
