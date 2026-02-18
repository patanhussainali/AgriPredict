
import pandas as pd
import numpy as np
import os
import random

# Reuse constants from generate_data.py for environmental simulation
SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Black Soil', 'Red Soil', 'Clay Loam']

# Soil nutrient profile approximations (N, P, K, pH)
SOIL_PROFILE = {
    'Clay': {'n': (120, 160), 'p': (30, 50), 'k': (40, 60), 'ph': (6.0, 7.5)},
    'Sandy': {'n': (60, 100), 'p': (20, 40), 'k': (30, 50), 'ph': (5.5, 7.0)},
    'Loam': {'n': (100, 140), 'p': (35, 55), 'k': (45, 65), 'ph': (6.0, 7.5)},
    'Black Soil': {'n': (140, 180), 'p': (40, 60), 'k': (50, 70), 'ph': (6.5, 8.0)},
    'Red Soil': {'n': (80, 120), 'p': (25, 45), 'k': (35, 55), 'ph': (5.5, 7.0)},
    'Clay Loam': {'n': (110, 150), 'p': (35, 55), 'k': (45, 65), 'ph': (6.2, 7.8)}
}

def get_soil_params(soil_type):
    profile = SOIL_PROFILE.get(soil_type, SOIL_PROFILE['Loam'])
    return {
        'n': random.uniform(*profile['n']),
        'p': random.uniform(*profile['p']),
        'k': random.uniform(*profile['k']),
        'ph': random.uniform(*profile['ph'])
    }

def get_weather_params(season):
    # Rough approximation based on TN seasons
    if season == 'Kharif' or 'Autumn' in season:
        return {'temp_min': 24, 'temp_max': 34, 'rainfall': random.uniform(400, 800), 'humidity': random.uniform(70, 90)}
    elif season == 'Rabi' or 'Winter' in season:
        return {'temp_min': 20, 'temp_max': 30, 'rainfall': random.uniform(100, 300), 'humidity': random.uniform(60, 80)}
    elif season == 'Zaid' or 'Summer' in season:
        return {'temp_min': 26, 'temp_max': 38, 'rainfall': random.uniform(50, 150), 'humidity': random.uniform(50, 70)}
    else: # Whole Year
        return {'temp_min': 22, 'temp_max': 32, 'rainfall': random.uniform(200, 600), 'humidity': random.uniform(60, 80)}

def load_data():
    base_path = os.path.dirname(os.path.abspath(__file__))
    processed_path = os.path.join(base_path, 'data', 'processed_kaggle_data.csv')
    
    # 1. OPTIMIZATION: Check for cached pre-processed data
    if os.path.exists(processed_path):
        print("Loading cached processed data...")
        return pd.read_csv(processed_path)

    data_path = os.path.join(base_path, 'data', 'Tamilnadu agriculture yield data.csv')
    
    if not os.path.exists(data_path):
        print(f"File not found: {data_path}")
        return None

    try:
        print("Processing raw data (this may take a moment)...")
        df = pd.read_csv(data_path)
        print(f"Original shape: {df.shape}")
        
        # 1. Basic Cleaning
        df = df.dropna(subset=['Production', 'Area'])
        df = df[df['Area'] > 0]
        
        # 2. Calculate Yield
        # Production is usually in Tonnes, Area in Hectares. Yield = Tonnes/Hectare
        df['Yield'] = df['Production'] / df['Area']
        
        # 3. Filter for reasonable yields (remove outliers)
        # Yield > 20 T/Ha is suspicious for most crops, but Sugar cane can be 100+.
        # We'll filter extreme outliers generically for now.
        df = df[df['Yield'] < 500] 

        # 4. Standardize Feature Names
        # Map Kaggle columns to our Training columns
        # Needed: District, Crop, Season, Soil_Type, Rainfall, Temp_Min, Temp_Max, pH, N, P, K
        
        # Rename columns to match
        df = df.rename(columns={
            'District_Name': 'District',
            'Season': 'Season',
            'Crop': 'Crop',
            'Crop_Year': 'Crop_Year'
        })
        
        # 5. Enrich with missing features (Simulation/Imputation)
        # We need to add Soil_Type, N, P, K, pH, Weather data because the dataset DOES NOT have them.
        # We will assign a random Soil Type to each row to simulate variety in the training data
        # In a real real scenario, we would map District -> Dominant Soil Type.
        
        augmented_rows = []
        for index, row in df.iterrows():
            # Assign random soil type typical for TN
            soil_type = random.choice(SOIL_TYPES)
            soil_params = get_soil_params(soil_type)
            
            # Assign weather based on season + noise
            weather = get_weather_params(str(row['Season']))
            
            # Apply randomness to weather
            rainfall = weather['rainfall'] * random.uniform(0.8, 1.2)
            temp_min = weather['temp_min'] + random.uniform(-2, 2)
            temp_max = weather['temp_max'] + random.uniform(-2, 2)
            humidity = weather['humidity'] + random.uniform(-5, 5)

            new_row = row.to_dict()
            new_row.update({
                'Soil_Type': soil_type,
                'n': soil_params['n'],
                'p': soil_params['p'],
                'k': soil_params['k'],
                'ph': soil_params['ph'],
                'rainfall': rainfall,
                'temp_min': temp_min,
                'temp_max': temp_max,
                'humidity': humidity
            })
            augmented_rows.append(new_row)
            
        final_df = pd.DataFrame(augmented_rows)
        
        # Select final columns
        final_cols = ['District', 'Crop', 'Crop_Year', 'Season', 'Soil_Type', 'rainfall', 'temp_min', 'temp_max', 'ph', 'n', 'p', 'k', 'humidity', 'Yield']
        final_df = final_df[final_cols]
        
        # Save to cache for next time
        final_df.to_csv(processed_path, index=False)
        print(f"Saved processed data to {processed_path}")
        
        print(f"Processed shape: {final_df.shape}")
        return final_df

    except Exception as e:
        print(f"Error processing data: {e}")
        return None

if __name__ == "__main__":
    df = load_data()
    if df is not None:
        print(df.head())
        print(df.describe())
