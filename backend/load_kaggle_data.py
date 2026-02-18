
import csv
import os
import random
import math

# Reuse constants
SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Black Soil', 'Red Soil', 'Clay Loam']

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
    if season == 'Kharif' or 'Autumn' in str(season):
        return {'temp_min': 24, 'temp_max': 34, 'rainfall': random.uniform(400, 800), 'humidity': random.uniform(70, 90)}
    elif season == 'Rabi' or 'Winter' in str(season):
        return {'temp_min': 20, 'temp_max': 30, 'rainfall': random.uniform(100, 300), 'humidity': random.uniform(60, 80)}
    elif season == 'Zaid' or 'Summer' in str(season):
        return {'temp_min': 26, 'temp_max': 38, 'rainfall': random.uniform(50, 150), 'humidity': random.uniform(50, 70)}
    else:
        return {'temp_min': 22, 'temp_max': 32, 'rainfall': random.uniform(200, 600), 'humidity': random.uniform(60, 80)}

def load_data():
    # Vercel-friendly path handling
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level if we are in backend/ and data/ is at root, OR assuming data is inside backend/
    # Based on file structure, data/ is at project root, backend/ is a sibling.
    project_root = os.path.dirname(current_dir) 
    
    # Check if data is at project root
    processed_path = os.path.join(project_root, 'data', 'processed_kaggle_data.csv')
    data_path = os.path.join(project_root, 'data', 'Tamilnadu agriculture yield data.csv')

    # Fallback: if running locally and data is inside backend/ (unlikely but possible in some setups)
    if not os.path.exists(processed_path) and not os.path.exists(data_path):
         processed_path = os.path.join(current_dir, 'data', 'processed_kaggle_data.csv')
         data_path = os.path.join(current_dir, 'data', 'Tamilnadu agriculture yield data.csv')
    
    # Restore base_path for subsequent code compatibility
    base_path = project_root
    
    # 1. Check cache
    if os.path.exists(processed_path):
        print("Loading cached processed data...")
        with open(processed_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)

    data_path = os.path.join(base_path, 'data', 'Tamilnadu agriculture yield data.csv')
    if not os.path.exists(data_path):
        print(f"File not found: {data_path}")
        return []

    try:
        print("Processing raw data (CSV)...")
        data = []
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Basic Cleaning
                    if not row.get('Production') or not row.get('Area'):
                        continue
                        
                    production = float(row['Production'])
                    area = float(row['Area'])
                    
                    if area <= 0:
                        continue
                        
                    yield_val = production / area
                    
                    # Outlier filtering
                    if yield_val >= 500:
                        continue
                        
                    # Standardize names
                    # CSV: District_Name, Season, Crop, Crop_Year
                    new_item = {
                        'District': row.get('District_Name'),
                        'Season': row.get('Season'),
                        'Crop': row.get('Crop'),
                        'Crop_Year': row.get('Crop_Year'),
                        'Yield': yield_val
                    }
                    
                    # Augmentation
                    soil_type = random.choice(SOIL_TYPES)
                    soil_params = get_soil_params(soil_type)
                    weather = get_weather_params(new_item['Season'])
                    
                    # Randomness
                    rainfall = weather['rainfall'] * random.uniform(0.8, 1.2)
                    temp_min = weather['temp_min'] + random.uniform(-2, 2)
                    temp_max = weather['temp_max'] + random.uniform(-2, 2)
                    humidity = weather['humidity'] + random.uniform(-5, 5)

                    new_item.update({
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
                    
                    data.append(new_item)
                except ValueError:
                    continue

        # Save cache
        if data:
            with open(processed_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            print(f"Saved processed data to {processed_path}")
            
        return data

    except Exception as e:
        print(f"Error processing data: {e}")
        return []

if __name__ == "__main__":
    data = load_data()
    print(f"Loaded {len(data)} records")
