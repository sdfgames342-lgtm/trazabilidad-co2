<template>
  <div id="app" class="app">
    <Header @start-tutorial="iniciarTutorial" />
    <main class="main">
      <!-- BARRA DE ESTADO -->
      <div class="main__status-bar">
        <div class="node-badge">
          <span class="node-badge__dot" aria-hidden="true"></span>
          NODO ACTIVO
        </div>
      </div>

      <!-- FORMULARIO Y RESULTADOS (mantén tu contenido existente) -->
      <section class="card" aria-labelledby="form-heading">
        <h2 id="form-heading" class="sr-only">Formulario de análisis</h2>
        <form @submit.prevent="analizarLote">
          <!-- ... todos tus campos ... -->
        </form>
      </section>

      <!-- ... resto de tu interfaz (mapa, resultados, tutorial, etc.) ... -->
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onUnmounted, onMounted } from 'vue'
import MapManager from './map-manager.js'
import KmlParser from './kml-parser.js'
import TutorialEngine from './tutorial-engine.js'
import { ApiClient } from './api-client.js'
import html2pdf from 'html2pdf.js'
import CertificateTemplate from './components/CertificateTemplate.vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import { getApiKey } from './utils/auth.js'

// ---------- Debug API Key ----------
onMounted(() => {
  const key = getApiKey()
  console.log('[TerraSentry Debug] API Key presente:', !!key, key ? `(${key.substring(0,8)}...)` : '')
  if (!key) {
    console.warn('[TerraSentry] No se encontró API Key. La app no podrá hacer análisis.')
  }
})

// ---------- validación ----------
function validarCoordenadas(raw) {
  let limpio = raw.trim().replace(/\s*;\s*/g, ';').replace(/\s*,\s*/g, ',');
  const partes = limpio.split(';');
  if (partes.length < 3) return null;
  for (let p of partes) {
    const [lat, lng] = p.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  }
  return limpio;
}

// ---------- Estado reactivo ----------
const productor = ref('')
const email = ref('')
const renspa = ref('')
const cuit = ref('')
const campaña = ref('')
const producto = ref('')
const coordenadasRaw = ref('')
const cargando = ref(false)
const errorMsg = ref(null)
const resultadoData = ref(null)
const mostrarMapa = ref(false)
const archivoCargado = ref(false)
const anonimizarKML = ref(false)
const posibleSwap = ref(false)
const fueraDeCordoba = ref(false)
const kmlFileInput = ref(null)
const modoDibujo = ref(false)
const certificadoVisible = ref(false)

// ---------- Servicios ----------
const mapaPrincipal = new MapManager('mapContainer')
let mapaDibujo = null
let dibujoItems = null

// ---------- Tutorial ----------
const tutorialActivo = ref(false)
import { watch } from 'vue'
watch(tutorialActivo, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
const pasoActual = ref(0)
const tooltipStyle = ref({})
const pasos = [
  { selector: "input[placeholder='Establecimiento Don Juan']", texto: "1. Completá el nombre del productor." },
  { selector: "input[placeholder='contacto@agro.com']", texto: "2. Ingresá un correo electrónico de contacto." },
  { selector: "input[placeholder='04.123.0.45678/00']", texto: "3. Número de RENSPA del establecimiento." },
  { selector: "input[placeholder='20-34567890-9']", texto: "4. CUIT o CUIL del productor." },
  { selector: "input[placeholder='2025/2026']", texto: "5. Campaña actual." },
  { selector: "input[placeholder='Soja']", texto: "6. Producto principal." },
  { selector: ".btn--draw", texto: "7. Hacé clic en DIBUJA para dibujar el polígono. Luego analizá el lote." }
]
const tutorial = new TutorialEngine(pasos, {
  onStateChange: (estado) => {
    tutorialActivo.value = estado.activo
    pasoActual.value = estado.pasoActual
    tooltipStyle.value = estado.tooltipStyle
  },
  onClickElemento: () => {}
})

function iniciarTutorial() { tutorial.iniciar() }
function manejarClickOverlay(event) { tutorial.manejarClick(event) }
function siguientePaso() { tutorial.siguiente() }
function anteriorPaso() { tutorial.anterior() }
function finalizarTutorial() { tutorial.finalizar() }

// ---------- Computed ----------
const porcentajeDeforestacion = computed(() => {
  if (!resultadoData.value) return 0
  const d = parseFloat(resultadoData.value.deforestacion), t = parseFloat(resultadoData.value.areaTotal)
  return isNaN(d)||isNaN(t)||t<=0 ? 0 : Math.min(100, Math.round((d/t)*100))
})
const colorEstado = computed(() => {
  const p = porcentajeDeforestacion.value
  return p===0?'#10b981':p<5?'#f59e0b':p<20?'#f97316':'#ef4444'
})

// ---------- Métodos (conserva tus implementaciones originales) ----------
function cargarKML(event) { /* ... igual que antes ... */ }
function descargarKML() { /* ... */ }
async function analizarLote() { /* ... */ }
async function mostrarEnMapa() { /* ... */ }
function generarReporteLocal() { /* ... */ }
async function generarReporteIA() { /* ... */ }
function exportarCertificadoFormal() { /* ... */ }
function abrirDibujo() { /* ... */ }
function confirmarDibujo() { /* ... */ }
function cerrarDibujo() { /* ... */ }

// Exportaciones necesarias (si usas componentes hijos, etc.)
</script>

<style>
@import './styles.css';
@import 'leaflet/dist/leaflet.css';
@import 'leaflet-draw/dist/leaflet.draw.css';

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main {
  flex: 1;
}
</style>
