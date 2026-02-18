import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from load_kaggle_data import load_data

def train_and_save():
    print("Loading Kaggle dataset...")
    df = load_data()
    
    if df is None or df.empty:
        print("Failed to load data. Aborting.")
        return

    print(f"Training on {len(df)} records.")
    
    # 1. Prepare Features and Target
    # Target column is 'Yield' from load_kaggle_data.py
    if 'Yield' not in df.columns:
        print("Error: 'Yield' column not found in dataset.")
        print("Columns:", df.columns)
        return

    X = df.drop(['Yield', 'Crop_Year'], axis=1, errors='ignore')
    y = df['Yield']
    
    # 2. Encoding
    # We use get_dummies. In a real prod environment, we should fit a OneHotEncoder.
    # For MVP consistency with frontend, we align columns later or ensuring standard values.
    X_encoded = pd.get_dummies(X, columns=['District', 'Crop', 'Season', 'Soil_Type'])
    feature_columns = X_encoded.columns.tolist()
    
    # 3. Split
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
    
    # 4. Train
    print("Training Random Forest...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Trained Successfully.")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2 Score: {r2:.4f}")
    
    # 6. Save Model
    # Determine output directory (handle running from root or backend)
    output_dir = 'backend' if os.path.exists('backend') else '.'
    obs_path = os.path.join(output_dir, 'model_objects.joblib')
    
    joblib.dump({'model': model, 'features': feature_columns}, obs_path)
    print(f"Model saved to: {obs_path}")

if __name__ == "__main__":
    train_and_save()
