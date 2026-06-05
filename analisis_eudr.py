#!/usr/bin/env python3
"""
Herramienta de Trazabilidad EUDR - MVP Fase 2
Uso:
  python analisis_eudr.py --coords "lat,lon;lat,lon;..."
  python analisis_eudr.py --kml lote.kml
  python analisis_eudr.py --interactive
"""
import os, sys, json, argparse, math, requests
from datetime import datetime
import xml.etree.ElementTree as ET

# -------------------------------------------------------------------
# Configuración
# -------------------------------------------------------------------
API_URL = "https://data-api.globalforestwatch.org/analysis/zonal"
API_KEY = os.getenv("GFW_API_KEY")
if not API_KEY:
    print("Error: GFW_API_KEY no está definida. Ejecutá: source ~/.bashrc")
    sys.exit(1)

HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# -------------------------------------------------------------------
# Funciones
# -------------------------------------------------------------------
def parse_coords_string(coord_str):
    """Convierte 'lat1,lon1;lat2,lon2;...' en lista de [lon, lat]."""
    pairs = coord_str.strip().split(";")
    coords = []
    for pair in pairs:
        lat, lon = pair.split(",")
        coords.append([float(lon), float(lat)])
    # Cerrar el polígono si el último punto no coincide con el primero
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords

def parse_kml_coordinates(kml_path):
    """Extrae coordenadas del primer polígono en un KML."""
    tree = ET.parse(kml_path)
    root = tree.getroot()
    ns = {"kml": "http://www.opengis.net/kml/2.2"}
    elem = root.find(".//kml:coordinates", ns)
    if elem is None:
        raise ValueError("No se encontró <coordinates> en el KML")
    text = elem.text.strip()
    coords = []
    for point in text.split():
        lon, lat, *alt = point.split(",")
        coords.append([float(lon), float(lat)])
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords

def obtener_deforestacion(coordenadas):
    """Consulta a GFW y devuelve área deforestada post‑2020 en ha."""
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
                print("Respuesta inesperada:", data)
                return None
        else:
            print(f"Error API (HTTP {r.status_code}): {r.text}")
            return None
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None

def area_poligono_hectareas(coords):
    """
    Calcula el área en hectáreas de un polígono definido por [lon, lat].
    Usa la fórmula del área de Gauss (Shoelace) y un factor de conversión
    aproximado de grados a metros para la latitud media del polígono.
    """
    n = len(coords)
    if n < 3:
        return 0.0
    # Área en grados cuadrados (fórmula de Gauss)
    area_deg = 0.0
    for i in range(n - 1):
        x1, y1 = coords[i]
        x2, y2 = coords[i + 1]
        area_deg += (x1 * y2 - x2 * y1)
    area_deg = abs(area_deg) / 2.0
    # Conversión aproximada: 1° lat = 111320 m, 1° lon = 111320 * cos(lat_media)
    lat_media = sum(p[1] for p in coords) / n
    factor_m2 = 111320 * (111320 * math.cos(math.radians(lat_media)))
    area_m2 = area_deg * factor_m2
    return area_m2 / 10000  # a hectáreas

def generar_pdf(coordenadas, area_ha, output_path="reporte_eudr.pdf"):
    """Genera un PDF con el resultado del análisis."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import cm
    except ImportError:
        print("reportlab no instalado. Ejecutá: pip install reportlab")
        return
    c = canvas.Canvas(output_path, pagesize=A4)
    ancho, alto = A4
    # Título
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, alto - 2*cm, "INFORME DE DEBIDA DILIGENCIA - EUDR")
    # Datos generales
    c.setFont("Helvetica", 11)
    y = alto - 3.5*cm
    c.drawString(2*cm, y, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    c.drawString(2*cm, y - 0.5*cm, f"Superficie del lote: {area_poligono_hectareas(coordenadas):.2f} ha")
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
    # Coordenadas resumidas
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, y - 3*cm, "Coordenadas del polígono:")
    y2 = y - 3.5*cm
    for i, (lon, lat) in enumerate(coordenadas[:6]):
        c.drawString(2.5*cm, y2, f"Punto {i+1}: Lat {lat:.5f}, Lon {lon:.5f}")
        y2 -= 0.35*cm
    # Pie
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(2*cm, 2*cm, "Informe preliminar. Validar por auditor acreditado.")
    c.save()
    print(f"✅ PDF guardado en: {output_path}")

# -------------------------------------------------------------------
# Interfaz principal
# -------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--coords", type=str, help="lat,lon separados por ';'")
    group.add_argument("--kml", type=str, help="Ruta a archivo KML")
    group.add_argument("--interactive", action="store_true")
    args = parser.parse_args()

    if args.coords:
        coords = parse_coords_string(args.coords)
    elif args.kml:
        coords = parse_kml_coordinates(args.kml)
    else:
        print("Modo interactivo. Pegá las coordenadas:")
        print("Ejemplo: -33.12,-64.56;-33.12,-64.55;-33.13,-64.55;-33.13,-64.56")
        entrada = input("> ").strip()
        coords = parse_coords_string(entrada)

    print(f"📐 Procesando polígono con {len(coords)} puntos...")
    area = obtener_deforestacion(coords)
    if area is not None:
        print(f"🌳 Deforestación post‑2020: {area} ha")
    else:
        print("⚠️ No se pudo obtener el dato de deforestación.")
        area = None

    generar_pdf(coords, area)

if __name__ == "__main__":
    main()
