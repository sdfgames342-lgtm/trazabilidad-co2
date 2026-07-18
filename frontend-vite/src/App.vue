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

      <!-- FORMULARIO PRINCIPAL -->
      <section class="card" aria-labelledby="form-heading">
        <h2 id="form-heading" class="sr-only">Formulario de análisis</h2>
        <form @submit.prevent="analizarLote" class="analysis-form">
          <!-- DATOS DEL PRODUCTOR -->
          <fieldset class="form-fieldset">
            <legend class="form-legend">Datos del productor</legend>
            
            <div class="form-row">
              <label for="productor">🌾 Productor / Razón Social <span aria-hidden="true">*</span></label>
              <input type="text" id="productor" v-model="productor" placeholder="Establecimiento Don Juan" required autocomplete="organization">
            </div>
            
            <div class="form-row">
              <label for="email">📧 Correo Electrónico <span aria-hidden="true">*</span></label>
              <input type="email" id="email" v-model="email" placeholder="contacto@agro.com" required autocomplete="email">
            </div>
            
            <div class="form-row">
              <label for="renspa">📄 RENSPA <span aria-hidden="true">*</span></label>
              <input type="text" id="renspa" v-model="renspa" placeholder="04.123.0.45678/00" required>
            </div>
            
            <div class="form-row">
              <label for="cuit">🔢 CUIT / CUIL <span aria-hidden="true">*</span></label>
              <input type="text" id="cuit" v-model="cuit" placeholder="20-34567890-9" required>
            </div>
            
            <div class="form-row">
              <label for="campaña">📅 Campaña <span aria-hidden="true">*</span></label>
              <input type="text" id="campaña" v-model="campaña" placeholder="2025/2026" required>
            </div>
            
            <div class="form-row">
              <label for="producto">🌽 Producto <span aria-hidden="true">*</span></label>
              <input type="text" id="producto" v-model="producto" placeholder="Soja" required>
            </div>
          </fieldset>

          <!-- POLÍGONO DEL LOTE -->
          <fieldset class="form-fieldset">
            <legend class="form-legend">Polígono del lote</legend>
            
            <div class="form-row">
              <label for="kmlFile">📁 Cargar KML</label>
              <input type="file" id="kmlFile" ref="kmlFileInput" accept=".kml,.kmz" @change="cargarKML($event)" class="form__file-input">
              <div class="form-row__file-actions">
                <button type="button" class="btn btn--download" @click="$refs.kmlFileInput.click()">📥 Subir archivo</button>
                <span v-if="archivoCargado" class="form-row__file-status">✅ KML cargado</span>
              </div>
              <span class="hint">Seleccioná un archivo .kml o .kmz (solo polígonos)</span>
            </div>

            <div class="form-row">
              <button type="button" class="btn btn--draw" @click="abrirDibujo">✏️ DIBUJAR POLÍGONO</button>
              <span class="hint">Abre un mapa en pantalla completa para marcar el lote manualmente.</span>
            </div>

            <div class="form-row">
              <label for="coordenadas">📍 Coordenadas</label>
              <textarea id="coordenadas" v-model="coordenadasRaw" rows="3" placeholder="-33.1234,-64.3500; -33.1234,-64.3450; ..." required></textarea>
              <span class="hint">Formato: lat,lon; lat,lon; … (mínimo 3 puntos)</span>
            </div>

            <div v-if="posibleSwap" class="swap-warning" role="alert">
              ⚠️ <strong>¿Coordenadas invertidas?</strong> El formato correcto es <strong>latitud,longitud</strong>.
            </div>
          </fieldset>

          <!-- BOTONES DE ACCIÓN -->
          <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="cargando">
              <span v-if="!cargando">🌿 Analizar Lote</span>
              <span v-else>🌀 Analizando matrices...</span>
            </button>
            <button type="button" class="btn btn--map" @click="mostrarEnMapa" :disabled="!coordenadasRaw.trim()">🗺️ Ver en Mapa</button>
          </div>
        </form>
      </section>

      <!-- MAPA -->
      <section v-if="mostrarMapa" class="card" aria-label="Mapa">
        <div id="mapContainer" role="application" aria-label="Mapa interactivo de parcelas agrícolas"></div>
        <p class="map-hint">📍 Panel Leaflet activo. Usá las herramientas de dibujo.</p>
      </section>

      <!-- RESULTADOS Y ERRORES -->
      <transition name="fade">
        <div v-if="errorMsg" class="card card--error" role="alert">
          <div class="card__error-icon" aria-hidden="true">⚠️</div>
          <p class="card__error-text">{{ errorMsg }}</p>
        </div>

        <div v-else-if="resultadoData" class="card card--result">
          <div class="result-badge" :style="{ background: colorEstado + '22', color: colorEstado, borderColor: colorEstado + '40' }">
            {{ resultadoData.veredicto }}
          </div>
          
          <p class="ubicacion-lote" v-if="resultadoData.ubicacion">📍 {{ resultadoData.ubicacion.formatted }}</p>

          <div class="metric-group">
            <div class="metric"><span class="metric__icon">🌎</span><div class="metric__value">{{ resultadoData.areaTotal }} <span>ha</span></div><div class="metric__label">Superficie</div></div>
            <div class="metric"><span class="metric__icon">🔥</span><div class="metric__value">{{ resultadoData.deforestacion }} <span>ha</span></div><div class="metric__label">Deforestación</div></div>
            <div class="metric"><span class="metric__icon">🌿</span><div class="metric__value">{{ resultadoData.carbono }} <span>tCO₂e</span></div><div class="metric__label">Carbono</div></div>
            <div class="metric"><span class="metric__icon">📊</span><div class="metric__value">{{ resultadoData.indiceVerde }}</div><div class="metric__label">Índice Verde</div></div>
          </div>

          <div class="result__actions">
            <button @click="generarReporteIA" class="btn btn--ai">🤖 Análisis IA</button>
            <button @click="generarReporteLocal" class="btn btn--primary">📋 Certificado TXT</button>
            <button @click="exportarCertificadoFormal" class="btn btn--primary">🎓 Certificado PDF</button>
          </div>
        </div>
      </transition>

      <!-- MODAL DE DIBUJO -->
      <div v-if="modoDibujo" class="draw-modal-overlay" role="dialog" aria-modal="true">
        <div id="drawMapContainer" class="draw-modal-map"></div>
        <div class="draw-modal-actions">
          <button class="btn btn--confirm" @click="confirmarDibujo">✅ Confirmar</button>
          <button class="btn btn--cancel" @click="cerrarDibujo">❌ Cancelar</button>
        </div>
      </div>

      <!-- TUTORIAL OVERLAY -->
      <div v-if="tutorialActivo" class="tutorial-overlay" @click.stop="manejarClickOverlay" role="dialog" aria-modal="true">
        <div class="tutorial-tooltip" v-if="tutorialActivo && pasoActual !== null" :style="tooltipStyle">
          <div class="tutorial-tooltip-arrow"></div>
          <p>{{ pasos[pasoActual]?.texto }}</p>
          <div class="tutorial-nav">
            <button class="tutorial-btn tutorial-btn--prev" @click="anteriorPaso" :disabled="pasoActual === 0">Anterior</button>
            <span class="tutorial-counter">{{ pasoActual+1 }} / {{ pasos.length }}</span>
            <button class="tutorial-btn tutorial-btn--next" @click="pasoActual === pasos.length-1 ? finalizarTutorial() : siguientePaso()">
              {{ pasoActual === pasos.length-1 ? "Finalizar" : "Siguiente" }}
            </button>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onUnmounted, watch } from 'vue'
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
const apiKey = getApiKey()
if (!apiKey) {
  console.warn('[TerraSentry] No se encontró API Key. La app usará la clave pública por defecto.')
}

// ---------- Validación ----------
function validarCoordenadas(raw) {
  let limpio = raw.trim().replace(/\s*;\s*/g, ';').replace(/\s*,\s*/g, ',')
  const partes = limpio.split(';')
  if (partes.length < 3) return null
  for (let p of partes) {
    const [lat, lng] = p.split(',').map(Number)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  }
  return limpio
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
const pasoActual = ref(0)
const tooltipStyle = ref({})

const pasos = [
  { selector: "input[placeholder='Establecimiento Don Juan']", texto: "1. Completá el nombre del productor." },
  { selector: "input[placeholder='contacto@agro.com']", texto: "2. Ingresá un correo electrónico de contacto." },
  { selector: "input[placeholder='04.123.0.45678/00']", texto: "3. Número de RENSPA del establecimiento." },
  { selector: "input[placeholder='20-34567890-9']", texto: "4. CUIT o CUIL del productor." },
  { selector: "input[placeholder='2025/2026']", texto: "5. Campaña actual." },
  { selector: "input[placeholder='Soja']", texto: "6. Producto principal." },
  { selector: ".btn--draw", texto: "7. Hacé clic en DIBUJA para dibujar el polígono." }
]

const tutorial = new TutorialEngine(pasos, {
  onStateChange: (estado) => {
    tutorialActivo.value = estado.activo
    pasoActual.value = estado.pasoActual
    tooltipStyle.value = estado.tooltipStyle
  },
  onClickElemento: () => {}
})

watch(tutorialActivo, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
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

// ---------- Métodos ----------
function cargarKML(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try { coordenadasRaw.value = KmlParser.parse(e.target.result); archivoCargado.value = true; errorMsg.value = null }
    catch (err) { errorMsg.value = 'Error al procesar KML: ' + err.message; archivoCargado.value = false }
  }
  reader.readAsText(file)
}

function descargarKML() {
  if (!coordenadasRaw.value.trim()) { errorMsg.value = 'No hay coordenadas para generar KML'; return }
  const nombre = productor.value || 'Establecimiento'
  const datos = resultadoData.value ? { areaTotal:resultadoData.value.areaTotal, deforestacion:resultadoData.value.deforestacion, carbono:resultadoData.value.carbono, indiceVerde:resultadoData.value.indiceVerde, veredicto:resultadoData.value.veredicto } : null
  const kml = KmlParser.generate(coordenadasRaw.value, nombre, datos)
  const blob = new Blob([kml], {type:'application/vnd.google-earth.kml+xml'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${nombre.replace(/\s+/g,'_')}.kml`; a.click()
  URL.revokeObjectURL(url)
}

async function analizarLote() {
  errorMsg.value = null; resultadoData.value = null
  if (!productor.value || !email.value || !renspa.value || !cuit.value || !campaña.value || !producto.value) {
    errorMsg.value = 'Complete todos los campos obligatorios'; return
  }
  const sanitizado = validarCoordenadas(coordenadasRaw.value)
  if (!sanitizado) { errorMsg.value = 'Formato de coordenadas incorrecto'; return }
  cargando.value = true
  try {
    const data = await ApiClient.analyze({
      coords: sanitizado, productor: productor.value, email: email.value,
      renspa: renspa.value, cuit: cuit.value, campaña: campaña.value, producto: producto.value
    })
    // Asignación REACTIVA correcta de todos los campos, especialmente carbono
    resultadoData.value = {
      areaTotal: data.area_total_ha,
      deforestacion: data.deforestacion_ha,
      carbono: data.carbono_ton,        // <-- ¡Este es el campo clave!
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
      compliance_token: data.compliance_token,
      area_protegida: data.area_protegida
    }
    console.log('[App] resultadoData asignado:', resultadoData.value)
  } catch (err) { errorMsg.value = err.message }
  finally { cargando.value = false }
}

async function mostrarEnMapa() {
  if (!coordenadasRaw.value.trim()) { errorMsg.value = 'Ingrese coordenadas primero'; return }
  mostrarMapa.value = true
  await nextTick()
  mapaPrincipal.initialize(coordenadasRaw)
  mapaPrincipal.drawPolygon(coordenadasRaw.value, colorEstado.value)
}

function generarReporteLocal() {
  if (!resultadoData.value) return
  const reporte = `CERTIFICADO DE TRAZABILIDAD EUDR\n============================\nVeredicto: ${resultadoData.value.veredicto}\nToken: ${resultadoData.value.compliance_token}`
  const blob = new Blob([reporte], {type:'text/plain'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'Certificado_TerraSentry.txt'; a.click()
  URL.revokeObjectURL(url)
}

function exportarCertificadoFormal() {
  if (!resultadoData.value) return
  certificadoVisible.value = true
  nextTick(() => {
    const element = document.getElementById('certificado-formal')
    if (!element) return
    html2pdf().set({ margin: 10, filename: 'Certificado_TerraSentry.pdf' }).from(element).save()
    certificadoVisible.value = false
  })
}

function abrirDibujo() {
  modoDibujo.value = true
  nextTick(() => {
    // Destruir instancia anterior si existe
    if (mapaDibujo) mapaDibujo.remove()
    mapaDibujo = L.map('drawMapContainer', {
      zoomControl: true,
      attributionControl: false
    }).setView([-33.12, -64.35], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(mapaDibujo)

    dibujoItems = new L.FeatureGroup()
    mapaDibujo.addLayer(dibujoItems)

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: '#10b981' }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false
      },
      edit: false
    })
    mapaDibujo.addControl(drawControl)

    mapaDibujo.on(L.Draw.Event.CREATED, (e) => {
      dibujoItems.clearLayers()
      dibujoItems.addLayer(e.layer)
    })
  })
}

function confirmarDibujo() {
  if (!dibujoItems || dibujoItems.getLayers().length === 0) {
    errorMsg.value = 'Debe dibujar un polígono primero.'
    return
  }
  const layer = dibujoItems.getLayers()[0]
  if (layer instanceof L.Polygon) {
    const coords = layer.getLatLngs()[0].map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ')
    coordenadasRaw.value = coords
    console.log('[App] Coordenadas actualizadas desde el dibujo:', coords)
  }
  cerrarDibujo()
}

function cerrarDibujo() {
  if (mapaDibujo) {
    mapaDibujo.remove()
    mapaDibujo = null
    dibujoItems = null
  }
  modoDibujo.value = false
}

async function generarReporteIA() {
  // Implementa según tu API
}

onUnmounted(() => {
  if (mapaDibujo) mapaDibujo.remove()
})
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
  width: 100%;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Asegurar que el mapa y sus controles sean interactuables */
#mapContainer,
#drawMapContainer {
  z-index: 1;
}

/* Controles de dibujo de Leaflet por encima de otros elementos */
.leaflet-draw {
  z-index: 1000 !important;
}

.leaflet-draw-toolbar {
  z-index: 1001 !important;
}

/* Modal de dibujo */
.draw-modal-overlay {
  z-index: 2000;
}

.draw-modal-map {
  z-index: 2001;
}
</style>
