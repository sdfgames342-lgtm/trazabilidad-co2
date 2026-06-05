import os
import sys
import json
import traceback
from datetime import datetime
import requests
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

# Configuración de la API de GFW
API_URL = "https://data-api.globalforestwatch.org/analysis/zonal"
API_KEY = os.getenv("GFW_API_KEY")
if not API_KEY:
    print("Error: GFW_API_KEY no está definida. Ejecutá: source ~/.bashrc")
    sys.exit(1)

HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

app = Flask(__name__)
CORS(app)  # permite peticiones desde el frontend

# --------------------------------------------------
# Lógica de análisis (la misma que ya usás)
# --------------------------------------------------
def parse_coords_string(coord_str):
    pairs = coord_str.strip().split(";")
    coords = []
    for pair in pairs:
        lat, lon = pair.split(",")
        coords.append([float(lon), float(lat)])
    if len(coords) > 0 and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords

def obtener_deforestacion(coordenadas):
    payload = {
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordenadas]
        },
        "sum": ["area__ha"],
        "group_by": [],
        "filters": [],
        "start_date": "2021-01-01",
        "end_date": datetime.now().strftime("%Y-%m-%d")
    }
    try:
        r = requests.post(API_URL, headers=HEADERS, json=payload, timeout=30)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data.get("data"), list) and len(data["data"]) > 0:
                return data["data"][0]["area__ha"]
            else:
                return None
        else:
            return None
    except Exception:
        return None

def generar_pdf(coordenadas, area_ha, output_path="reporte_temp.pdf"):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import cm
        import math
    except ImportError:
        raise RuntimeError("reportlab no instalado")

    c = canvas.Canvas(output_path, pagesize=A4)
    ancho, alto = A4
    # Título
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, alto - 2*cm, "INFORME DE DEBIDA DILIGENCIA - EUDR")
    # Datos
    c.setFont("Helvetica", 11)
    y = alto - 3.5*cm
    c.drawString(2*cm, y, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    # Superficie aproximada
    try:
        # cálculo simple de área
        area_lote = 0.0
        if len(coordenadas) >= 3:
            import math
            n = len(coordenadas)
            area_deg = 0.0
            for i in range(n-1):
                x1, y1 = coordenadas[i]
                x2, y2 = coordenadas[i+1]
                area_deg += (x1*y2 - x2*y1)
            area_deg = abs(area_deg) / 2.0
            lat_media = sum(p[1] for p in coordenadas) / n
            factor = 111320 * (111320 * math.cos(math.radians(lat_media)))
            area_lote = (area_deg * factor) / 10000
    except:
        area_lote = 0.0
    c.drawString(2*cm, y - 0.5*cm, f"Superficie estimada: {area_lote:.2f} ha")
    c.drawString(2*cm, y - 1*cm, f"Deforestación post‑2020: {area_ha if area_ha is not None else 'Error'} ha")
    # Veredicto
    if area_ha == 0:
        veredicto = "✅ APTO: Sin deforestación desde 31/12/2020."
    elif area_ha is not None:
        veredicto = "⚠️  NO APTO: Deforestación detectada."
    else:
        veredicto = "❌ ERROR: No se pudo analizar."
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, y - 2*cm, veredicto)
    # Coordenadas
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, y - 3*cm, "Coordenadas procesadas:")
    y2 = y - 3.5*cm
    for i, (lon, lat) in enumerate(coordenadas[:6]):
        c.drawString(2.5*cm, y2, f"Punto {i+1}: Lat {lat:.5f}, Lon {lon:.5f}")
        y2 -= 0.35*cm
    # Pie
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(2*cm, 2*cm, "Informe preliminar generado automáticamente.")
    c.save()
    return output_path

# --------------------------------------------------
# Endpoint de la API
# --------------------------------------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        coords_str = data.get('coords')
        if not coords_str:
            return jsonify({"error": "Falta el parámetro 'coords'"}), 400
        coordenadas = parse_coords_string(coords_str)
        if len(coordenadas) < 4:
            return jsonify({"error": "Se necesitan al menos 3 puntos"}), 400

        area = obtener_deforestacion(coordenadas)
        if area is None:
            return jsonify({"error": "No se pudo contactar la API de GFW"}), 502

        pdf_path = generar_pdf(coordenadas, area)
        return send_file(pdf_path, as_attachment=True, download_name="reporte_eudr.pdf")

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return {"status": "ok"}

if __name__ == '__main__':
    # Escucha en todas las interfaces para que Ngrok lo exponga
    app.run(host='0.0.0.0', port=5000, debug=False)
