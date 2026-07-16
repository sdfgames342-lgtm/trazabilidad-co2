#!/data/data/com.termux/files/usr/bin/bash
set -o pipefail

BASE_URL="http://127.0.0.1:5000"
API_KEY="${API_KEY}"
TIMEOUT=30
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

if [ -z "$API_KEY" ]; then
    echo -e "${RED}API_KEY no definida. Ejecuta: export \$(cat .env | xargs)${NC}"
    exit 1
fi

VALID='{"coords":"-33.12,-64.35;-33.13,-64.36;-33.14,-64.35","productor":"Test","email":"a@b.com","renspa":"04.123.0.45678/00","cuit":"20-34567890-9","campaña":"2025","producto":"Soja"}'

# ------------------------------------------------------------
# 1. Caché (5 peticiones secuenciales, suficiente)
# ------------------------------------------------------------
echo -e "${YELLOW}1. Prueba de caché (5 peticiones)${NC}"
for i in {1..5}; do
    start=$(date +%s%N)
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
        -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze")
    end=$(date +%s%N)
    ms=$(( (end - start) / 1000000 ))
    echo "  $i: HTTP $code (${ms}ms)"
done

# ------------------------------------------------------------
# 2. Ráfaga asíncrona para activar rate limiting
# ------------------------------------------------------------
echo -e "\n${YELLOW}2. Ráfaga asíncrona (20 peticiones, debe activar rate limit)${NC}"
tmp=$(mktemp -d)
for i in {1..20}; do
    ( curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
        -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze" > "$tmp/$i" ) &
done
wait

success=0
limited=0
for i in {1..20}; do
    code=$(cat "$tmp/$i")
    [ "$code" = "200" ] && success=$((success+1))
    [ "$code" = "429" ] && limited=$((limited+1))
done
rm -r "$tmp"
echo "  Resultados: 200=$success, 429=$limited"
if [ $limited -gt 0 ]; then
    echo -e "  ${GREEN}✓ Rate limiting activado ($limited bloqueos)${NC}"
else
    echo -e "  ${RED}✗ Rate limit no detectado. Revisa Flask-Limiter.${NC}"
fi

# ------------------------------------------------------------
# 3. Concurrencia real (medir tiempo de respuesta simultáneo)
# ------------------------------------------------------------
echo -e "\n${YELLOW}3. Concurrencia (3 peticiones simultáneas con medición)${NC}"
tmp=$(mktemp -d)
for i in {1..3}; do
    ( start=$(date +%s%N)
      code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
          -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
          -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze")
      end=$(date +%s%N)
      echo "$code $(( (end - start) / 1000000 ))" > "$tmp/$i"
    ) &
done
wait
for i in {1..3}; do
    read -r code ms < "$tmp/$i"
    echo "  Hilo $i: HTTP $code (${ms}ms)"
done
rm -r "$tmp"

echo -e "\n${YELLOW}=== PRUEBA DE ESTRÉS FINALIZADA ===${NC}"
