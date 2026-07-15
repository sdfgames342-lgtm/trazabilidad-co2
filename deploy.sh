#!/bin/bash
echo "--- Iniciando despliegue de TerraSentry ---"
git add .
git commit -m "Auto-deploy: $(date)"
git push origin main
echo "--- Cambios enviados a GitHub. Vercel comenzará el build en breve. ---"
