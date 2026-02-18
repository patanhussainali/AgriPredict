import pandas as pd
import numpy as np
import random

# Constants for simulation based on research for Tamil Nadu (Pudukkottai focus)
DISTRICTS = ['Pudukkottai', 'Thanjavur', 'Madurai', 'Trichy']
CROPS = ['Rice', 'Maize', 'Jowar', 'Ragi', 'Bajra', 'Pulses']
SEASONS = ['Kharif', 'Rabi', 'Zaid']
SOIL_TYPES = ['Clay Loam', 'Sandy Loam', 'Red Soil', 'Black Soil']

# Yield ranges (tons/ha) based on research
# Rice: ~2.5 - 4.5, Maize: ~5.0 - 8.0, Millets: ~1.0 - 2.5, Pulses: ~0.5 - 1.2
YIELD_BASE = {
    'Rice': 3.5,
    'Maize': 6.5,
    'Jowar': 1.5,
    'Ragi': 1.8,
    'Bajra': 1.2,
    'Pulses': 0.8
}

def generate_weather(season):
    # Simulate realistic weather based on season in TN
    # Kharif (Jun-Sep): SW Monsoon (Moderate rain), High Temp
    # Rabi (Oct-Feb): NE Monsoon (Heavy rain), Moderate Temp
    # Zaid (Mar-May): Dry, High Temp
    
    if season == 'Kharif':
        rainfall = np.random.normal(400, 100) # mm
        temp_min = np.random.normal(25, 2)
        temp_max = np.random.normal(35, 2)
        humidity = np.random.normal(70, 10)
    elif season == 'Rabi':
        rainfall = np.random.normal(600, 150) # NE monsoon is stronger in TN
        temp_min = np.random.normal(20, 2)
        temp_max = np.random.normal(30, 2)
        humidity = np.random.normal(80, 10)
    else: # Zaid
        rainfall = np.random.normal(50, 30)
        temp_min = np.random.normal(26, 2)
        temp_max = np.random.normal(38, 2)
        humidity = np.random.normal(60, 10)
        
    return abs(rainfall), temp_min, temp_max, min(100, max(30, humidity))

data = []
for _ in range(2000):
    district = random.choice(DISTRICTS)
    crop = random.choice(CROPS)
    season = random.choice(SEASONS)
    soil = random.choice(SOIL_TYPES)
    
    rainfall, temp_min, temp_max, humidity = generate_weather(season)
    
    ph = np.random.normal(6.5, 0.5) # Neutral-ish soil
    n = np.random.normal(140, 40) # Nitrogen
    p = np.random.normal(50, 15) # Phosphorus
    k = np.random.normal(50, 15) # Potassium
    
    # Calculate Yield with some logic
    base_yield = YIELD_BASE[crop]
    
    # Adjustments
    yield_factor = 1.0
    
    # Weather impact
    if crop == 'Rice':
        if rainfall < 300: yield_factor -= 0.2
        if rainfall > 1000: yield_factor -= 0.1 # Flood risk
    elif crop == 'Maize':
        if rainfall > 800: yield_factor -= 0.3 # Maize doesn't like waterlogging
    elif crop in ['Jowar', 'Ragi', 'Bajra']:
        if rainfall > 700: yield_factor -= 0.2 # Millets don't like too much water
    elif crop == 'Pulses':
        if rainfall > 600: yield_factor -= 0.25 # Sensitive to excess moisture
        
    # Soil impact
    if soil == 'Clay Loam' and crop == 'Rice': yield_factor += 0.1
    if soil == 'Red Soil' and crop == 'Maize': yield_factor += 0.1
    if soil == 'Black Soil' and crop == 'Jowar': yield_factor += 0.1
    if soil == 'Sandy Loam' and crop in ['Bajra', 'Ragi']: yield_factor += 0.1
    
    # Nutrient impact
    if n > 120 and p > 40 and k > 40: yield_factor += 0.1
    
    final_yield = base_yield * yield_factor + np.random.normal(0, 0.5)
    final_yield = max(0.5, final_yield) # No negative yields
    
    data.append([district, crop, season, soil, round(rainfall,1), round(temp_min,1), round(temp_max,1), round(humidity,1), round(ph,1), round(n,1), round(p,1), round(k,1), round(final_yield, 2)])

df = pd.DataFrame(data, columns=['District', 'Crop', 'Season', 'Soil_Type', 'Rainfall_mm', 'Min_Temp_C', 'Max_Temp_C', 'Humidity_%', 'ph', 'N', 'P', 'K', 'Yield_ton_per_ha'])
df.to_csv('data/crop_data.csv', index=False)
print("Dataset generated successfully at data/crop_data.csv")
