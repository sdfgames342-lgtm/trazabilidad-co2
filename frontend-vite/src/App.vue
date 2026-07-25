<template>
  <div id="app" class="app">
    <Header @start-tutorial="iniciarTutorial" />
    <main class="main">
      <!-- ... contenido anterior del template (formulario, mapa, etc.) ... -->
      
      <!-- Sección de resultados mejorada -->
      <div v-else-if="resultadoData" class="card card--result">
        <div class="result-badge" :style="{ background: colorEstado + '22', color: colorEstado, borderColor: colorEstado + '40' }">
          {{ resultadoData.veredicto }}
        </div>

        <p class="ubicacion-lote" v-if="resultadoData.ubicacion">📍 {{ resultadoData.ubicacion.formatted }}</p>

        <!-- Métricas principales -->
        <div class="metric-group">
          <div class="metric"><span class="metric__icon">🌎</span><div class="metric__value">{{ resultadoData.areaTotal }} <span>ha</span></div><div class="metric__label">Superficie</div></div>
          <div class="metric"><span class="metric__icon">🔥</span><div class="metric__value">{{ resultadoData.deforestacion }} <span>ha</span></div><div class="metric__label">Deforestación total</div></div>
          <div class="metric"><span class="metric__icon">⏳</span><div class="metric__value">{{ resultadoData.deforestacionPost2020 }} <span>ha</span></div><div class="metric__label">Deforestación post‑2020</div></div>
          <div class="metric"><span class="metric__icon">🌿</span><div class="metric__value">{{ resultadoData.carbono }} <span>tCO₂e</span></div><div class="metric__label">Carbono emitido</div></div>
          <div class="metric"><span class="metric__icon">📊</span><div class="metric__value">{{ resultadoData.indiceVerde }}</div><div class="metric__label">Índice Verde</div></div>
        </div>

        <!-- Área protegida (si aplica) -->
        <div v-if="resultadoData.areaProtegida && resultadoData.areaProtegida.intersecta" class="swap-warning">
          ⚠️ <strong>Área protegida detectada:</strong> {{ resultadoData.areaProtegida.nombre }} ({{ resultadoData.areaProtegida.designacion }})
        </div>

        <!-- Token de cumplimiento -->
        <div class="token-display">
          <strong>🔐 Token de cumplimiento:</strong>
          <code>{{ resultadoData.complianceToken }}</code>
        </div>

        <!-- Desglose anual de deforestación -->
        <div v-if="resultadoData.perdidaPorAnio && Object.keys(resultadoData.perdidaPorAnio).length" class="loss-breakdown">
          <h4>📅 Pérdida de cobertura arbórea por año</h4>
          <table>
            <tr v-for="(ha, year) in resultadoData.perdidaPorAnio" :key="year">
              <td>{{ year }}</td>
              <td>{{ ha }} ha</td>
            </tr>
          </table>
        </div>

        <div class="result__actions">
          <button @click="generarReporteIA" class="btn btn--ai">🤖 Análisis IA</button>
          <button @click="generarReporteLocal" class="btn btn--primary">📋 Certificado TXT</button>
          <button @click="exportarCertificadoFormal" class="btn btn--primary">🎓 Certificado PDF</button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
// ... (importaciones existentes sin cambios) ...

// Dentro de analizarLote, mapea el nuevo campo:
async function analizarLote() {
  // ... validaciones ...
  try {
    const data = await ApiClient.analyze({...})
    resultadoData.value = {
      areaTotal: data.area_total_ha,
      deforestacion: data.deforestacion_ha,
      deforestacionPost2020: data.deforestacion_post2020_ha,
      carbono: data.carbono_ton,
      gananciaBosque: data.ganancia_bosque_ha,
      bosqueBasal: data.bosque_basal_ha,
      indiceVerde: data.indice_verde,
      veredicto: data.veredicto,
      dentroCordoba: data.dentro_cordoba,
      centroidLat: data.centroid_lat,
      centroidLon: data.centroid_lon,
      calidadAire: data.calidad_aire,
      incendiosCercanos: data.incendios_cercanos,
      sismos: data.sismos_cercanos,
      ubicacion: data.ubicacion,
      complianceToken: data.compliance_token,
      areaProtegida: data.area_protegida,
      perdidaPorAnio: data.perdida_por_anio   // ← nuevo campo
    }
  } catch (err) { errorMsg.value = err.message }
  finally { cargando.value = false }
}
</script>

<style>
/* ... (tus estilos anteriores) ... */

.loss-breakdown {
  background: #1e293b;
  border-radius: 8px;
  padding: 0.75rem;
  margin: 1rem 0;
}
.loss-breakdown h4 {
  margin-bottom: 0.5rem;
  color: #e2e8f0;
}
.loss-breakdown table {
  width: 100%;
  border-collapse: collapse;
}
.loss-breakdown td {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid #334155;
}
</style>
