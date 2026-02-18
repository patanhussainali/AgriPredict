
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Cache for individual files
_file_cache = {}

def get_file_json(file_id):
    """
    Access specific file by ID.
    Expects file_id like 'file:59' -> loads '59.json'
    """
    global _file_cache
    
    # Check cache first
    if file_id in _file_cache:
        return _file_cache[file_id]

    try:
        print(f"DEBUG: get_file_json called with file_id='{file_id}'")
        
        # Extract ID number: 'file:59' or 'file%3A59' -> '59'
        # Simple robust extraction: remove 'file:' prefix chars if present
        clean_id = file_id.replace('file:', '').replace('file%3A', '')
            
        filename = f"{clean_id}.json"
        filepath = os.path.join(DATA_DIR, filename)
        
        print(f"DEBUG: Looking for file at: {filepath}")
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
                # Cache it
                _file_cache[file_id] = data
                print(f"DEBUG: Loaded {len(data)} records")
                return data
        else:
            print(f"DEBUG: File not found: {filepath}")
            return []
            
    except Exception as e:
        print(f"Error loading {file_id}: {e}")
        return []
