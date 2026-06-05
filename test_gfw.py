import os, requests

api_key = os.getenv("GFW_API_KEY")
if not api_key:
    print("Error: GFW_API_KEY no está definida. Ejecutá: source ~/.bashrc")
    exit(1)

url = "https://data-api.globalforestwatch.org/v2/analysis"
headers = {"x-api-key": api_key, "Content-Type": "application/json"}

payload = {
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-64.56, -33.12],
            [-64.55, -33.12],
            [-64.55, -33.13],
            [-64.56, -33.13],
            [-64.56, -33.12]
        ]]
    },
    "begin": "2021-01-01",
    "end": "2026-06-01",
    "indicators": ["umd_tree_cover_loss"],
    "output": "stats"
}

r = requests.post(url, headers=headers, json=payload)
print("Status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    loss = data["data"]["attributes"]["umd_tree_cover_loss"]["area"]
    print(f"Deforestación detectada: {loss} ha")
else:
    print("Error:", r.text)
