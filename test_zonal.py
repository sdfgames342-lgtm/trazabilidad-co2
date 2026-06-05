import os, requests

api_key = os.getenv("GFW_API_KEY")
if not api_key:
    print("Error: GFW_API_KEY no está definida. Ejecutá: source ~/.bashrc")
    exit(1)

url = "https://data-api.globalforestwatch.org/analysis/zonal"
headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

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
    "sum": ["area__ha"],
    "group_by": [],
    "filters": [],
    "start_date": "2021-01-01",
    "end_date": "2026-06-01"
}

r = requests.post(url, headers=headers, json=payload)
print("Status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    print("Datos recibidos:")
    print(data)

    # Extraer área correctamente (data es una lista de resultados)
    if isinstance(data.get("data"), list) and len(data["data"]) > 0:
        area = data["data"][0]["area__ha"]
        print(f"\nDeforestación total post-2020: {area} ha")
        if area == 0:
            print("✅ Este lote NO registra deforestación desde el 31/12/2020. ¡Es apto para exportar a la UE!")
        else:
            print("⚠️  Se detectó deforestación. El lote podría no cumplir con el reglamento EUDR.")
    else:
        print("No se encontraron datos de área en la respuesta.")
else:
    print("Error:", r.status_code, r.text)
