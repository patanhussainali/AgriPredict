import joblib
import os

model_path = 'backend/model_objects.joblib'
output_path = 'backend/model_objects_compressed.joblib'

print(f"Loading model from {model_path}...")
data = joblib.load(model_path)

print(f"Saving compressed model to {model_path} with compress=3...")
# Overwrite the original file with compressed version
joblib.dump(data, model_path, compress=3)

new_size = os.path.getsize(model_path)
print(f"Done. New size: {new_size / (1024*1024):.2f} MB")
