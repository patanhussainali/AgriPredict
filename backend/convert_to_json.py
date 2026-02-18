
import pandas as pd
import json
import os

# Define base path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# File mapping with IDs (Adjusted for actual filenames in backend/data)
files = {
    'file:59': 'Tamilnadu Crop-Production.csv', # Space instead of hyphen in actual file
    'file:60': 'crop_production_history.csv', 
    'file:61': 'land_use.csv',
    'file:62': 'rice_production.csv',
    'file:63': 'rainfall_data.csv',
    'file:64': 'Tamilnadu agriculture yield data.csv' # Spaces in actual file
}

def convert_and_save():
    results = {}
    print("Starting conversion to JSON...")
    
    for file_id, filename in files.items():
        file_path = os.path.join(DATA_DIR, filename)
        
        if not os.path.exists(file_path):
            print(f"Warning: {filename} not found at {file_path}")
            continue
            
        try:
            df = pd.read_csv(file_path)
            
            # Special Handling for file:64 (Yield Data)
            # Users expect Yield column, but raw CSV has Production & Area
            if file_id == 'file:64':
                # 1. Basic Cleaning
                df = df.dropna(subset=['Production', 'Area'])
                df = df[df['Area'] > 0]
                
                # 2. Calculate Yield
                df['Yield'] = df['Production'] / df['Area']
                
                # 3. Filter outliers
                df = df[df['Yield'] < 500]
                
                # 4. Ensure Crop_Year is integer (if present)
                if 'Crop_Year' in df.columns:
                    df['Crop_Year'] = df['Crop_Year'].astype(int)
            
            json_data = df.to_json(orient='records', indent=2)
            
            # Save individual JSON files
            # Output filename based on ID: 59.json, 60.json etc.
            output_filename = f"{file_id.split(':')[1]}.json"
            output_path = os.path.join(DATA_DIR, output_filename)
            
            with open(output_path, 'w') as f:
                f.write(json_data)
            
            print(f"Saved {output_filename}")
            
            results[file_id] = {
                'rows': len(df),
                'columns': list(df.columns),
                'sample': json.loads(json_data)[:3],  # First 3 rows as sample
                'file': output_filename
            }
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    # Save all as single combined file
    combined_path = os.path.join(DATA_DIR, 'all_tamilnadu_data.json')
    
    # We need to reload them to combine them efficiently or just use the results dict if we stored data
    # But effectively, we want the *content* in the combined file.
    
    combined_data = {}
    for file_id, filename in files.items():
        output_filename = f"{file_id.split(':')[1]}.json"
        output_path = os.path.join(DATA_DIR, output_filename)
        if os.path.exists(output_path):
            with open(output_path, 'r') as f:
                combined_data[file_id] = json.load(f)
                
    with open(combined_path, 'w') as f:
        json.dump(combined_data, f, indent=2)
        
    print(f"Saved combined data to {combined_path}")

if __name__ == "__main__":
    convert_and_save()
