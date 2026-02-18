
import pandas as pd
import os

data_dir = r"backend/data"
files = [f for f in os.listdir(data_dir) if f.endswith('.csv')]


with open("backend/data_schema.txt", "w") as f:
    for file in files:
        try:
            df = pd.read_csv(os.path.join(data_dir, file), nrows=2)
            f.write(f"\n--- {file} ---\n")
            f.write(f"Columns: {df.columns.tolist()}\n")
            f.write(f"First Row: {df.iloc[0].to_dict()}\n")
        except Exception as e:
            f.write(f"Error reading {file}: {e}\n")
