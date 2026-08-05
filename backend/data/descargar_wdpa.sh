#!/usr/bin/env bash
# Descarga y convierte las áreas protegidas de Argentina desde la WDPA
set -e

OUTPUT_FILE="wdpa_argentina.json"
TEMP_DIR=$(mktemp -d)

echo "🔽 Descargando datos de Protected Planet (WDPA)..."
# URL del dataset público de WDPA (formato GeoJSON) - enlace a la versión más reciente
# Puedes obtener el enlace exacto desde https://www.protectedplanet.net/
# Alternativa: usar la API de Protected Planet (requiere token, pero hay un dataset público)
curl -L "https://d1gam3xoknrgr2.cloudfront.net/current/WDPA_WDOECM_Jul2024_Public.gpkg.zip" -o "$TEMP_DIR/wdpa.zip"

echo "📦 Descomprimiendo..."
unzip -q "$TEMP_DIR/wdpa.zip" -d "$TEMP_DIR"

echo "🔍 Filtrando Argentina..."
# Si tienes ogr2ogr (GDAL) instalado:
if command -v ogr2ogr &> /dev/null; then
    ogr2ogr -f GeoJSON -where "ISO3='ARG'" -simplify 0.01 "$OUTPUT_FILE" "$TEMP_DIR/WDPA_WDOECM_Jul2024_Public.gpkg"
else
    # Alternativa con Python puro
    python3 << 'PYEOF'
import json, fiona, sys
from fiona.transform import transform_geom
# Instalar fiona: pip install fiona
with fiona.open("$TEMP_DIR/WDPA_WDOECM_Jul2024_Public.gpkg", layer='WDPA_WDOECM_Jul2024_Public') as src:
    features = []
    for feat in src:
        if feat['properties'].get('ISO3') == 'ARG':
            # Simplificar geometría (opcional)
            feat['geometry'] = feat['geometry']  # Puedes aplicar simplificación aquí
            features.append(feat)
    with open("$OUTPUT_FILE", 'w') as out:
        json.dump({"type": "FeatureCollection", "features": features}, out)
PYEOF
fi

# Limpiar
rm -rf "$TEMP_DIR"
echo "✅ Archivo generado: $OUTPUT_FILE"
