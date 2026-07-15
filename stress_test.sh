#!/data/data/com.termux/files/usr/bin/bash
set -o pipefail

BASE_URL="http://127.0.0.1:5000"
API_KEY="${API_KEY}"
TIMEOUT=30
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

if [ -z "$API_KEY" ]; then
    echo -e "${RED}API_KEY no definida. Ejecuta: export $(cat .env | xargs)${NC}"
    exit 1
fi

VALID='{"coords":"-33.12,-64.35;-33.13,-64.36;-33.14,-64.35","productor":"Test","email":"a@b.com","renspa":"04.123.0.45678/00","cuit":"20-34567890-9","campaña":"2025","producto":"Soja"}'

# 1. Cache
echo -e "${YELLOW}1. Prueba de caché (10 peticiones)${NC}"
times=()
for i in {1..10}; do
    start=$(date +%s%N)
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze")
    end=$(date +%s%N)
    ms=$(( (end - start) / 1000000 ))
    echo "  $i: HTTP $code (${ms}ms)"
    [ "$code" = "200" ] && times+=($ms)
done
if [ ${#times[@]} -gt 0 ]; then
    sum=0; min=${times[0]}; max=${times[0]}
    for t in "${times[@]}"; do sum=$((sum+t)); [ $t -lt $min ] && min=$t; [ $t -gt $max ] && max=$t; done
    echo -e "  Promedio: $((sum/${#times[@]}))ms | Min: ${min}ms | Max: ${max}ms"
    [ $min -lt $((sum/${#times[@]})) ] && echo -e "  ${GREEN}✓ Posible efecto de caché${NC}" || echo -e "  ${YELLOW}⚠ Sin mejora de caché${NC}"
fi

# 2. Concurrencia
echo -e "\n${YELLOW}2. Concurrencia (5 en paralelo)${NC}"
tmp=$(mktemp -d)
for i in {1..5}; do
    ( curl -s -o /dev/null -w "%{http_code} %{time_total}" -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze" > "$tmp/$i" ) &
done
wait
err=0
for i in {1..5}; do
    read -r code time_s < "$tmp/$i"
    echo "  Hilo $i: HTTP $code (${time_s}s)"
    [ "$code" != "200" ] && err=$((err+1))
done
rm -r "$tmp"
[ $err -eq 0 ] && echo -e "${GREEN}✓ Todas respondieron 200${NC}" || echo -e "${YELLOW}⚠ Fallos: $err${NC}"

# 3. Rate limiting
echo -e "\n${YELLOW}3. Rate limiting (12 peticiones rápidas)${NC}"
hits=0
for i in {1..12}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" -d "$VALID" --max-time $TIMEOUT "$BASE_URL/analyze")
    if [ "$code" = "429" ]; then
        echo "  $i: HTTP 429 (rate limit)"
        hits=$((hits+1))
    fi
done
[ $hits -gt 0 ] && echo -e "${GREEN}✓ Rate limit activo (${hits} bloqueos)${NC}" || echo -e "${RED}✘ Rate limit no detectado${NC}"

echo -e "\n${YELLOW}=== PRUEBA DE ESTRÉS FINALIZADA ===${NC}"
