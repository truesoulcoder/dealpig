import requests

# Use the actual file from /data/logs
file_path = r"data/logs/supabase-edge-logs-ygkbhfdqvrluegsrjpaj.csv (1).csv"
url = "http://localhost:3000/api/leads/upload"

with open(file_path, "rb") as f:
    files = {"file": (file_path, f, "text/csv")}
    resp = requests.post(url, files=files)
    print("Status:", resp.status_code)
    print("Response:", resp.text)
