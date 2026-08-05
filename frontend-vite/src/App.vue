<template>
  <div id="app" class="app">
    <Header @start-tutorial="iniciarTutorial" />
    <main class="main">
      <div class="main__status-bar">
        <div class="node-badge"><span class="node-badge__dot"></span> NODO ACTIVO</div>
      </div>

      <!-- Formulario -->
      <section class="card">
        <h2 class="sr-only">Formulario de análisis</h2>
        <form @submit.prevent="analizarLote" class="analysis-form">
          <fieldset class="form-fieldset">
            <legend class="form-legend">Datos del productor</legend>
            <div class="form-row"><label>🌾 Productor</label><input v-model="productor" placeholder="Establecimiento" required></div>
            <div class="form-row"><label>📧 Correo</label><input v-model="email" placeholder="correo@agro.com" required></div>
            <div class="form-row"><label>📄 RENSPA</label><input v-model="renspa" placeholder="04.123.0.45678/00" required></div>
            <div class="form-row"><label>🔢 CUIT</label><input v-model="cuit" placeholder="20-34567890-9" required></div>
            <div class="form-row"><label>📅 Campaña</label><input v-model="campaña" placeholder="2025/2026" required></div>
            <div class="form-row"><label>🌽 Producto</label><input v-model="producto" placeholder="Soja" required></div>
          </fieldset>
          <fieldset class="form-fieldset">
            <legend class="form-legend">Polígono del lote</legend>
            <div class="form-row">
              <label>📁 Cargar KML</label>
              <input type="file" ref="kmlFileInput" accept=".kml,.kmz" @change="cargarKML" class="form__file-input">
              <button type="button" class="btn btn--download" @click="$refs.kmlFileInput.click()">📥 Subir archivo</button>
              <span v-if="archivoCargado" class="form-row__file-status">✅ KML cargado</span>
            </div>
            <div class="form-row"><button type="button" class="btn btn--draw" @click="abrirDibujo">✏️ DIBUJAR POLÍGONO</button></div>
            <div class="form-row"><label>📍 Coordenadas</label><textarea v-model="coordenadasRaw" rows="3" placeholder="lat,lon; ..." required></textarea></div>
          </fieldset>
          <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="cargando">🌿 Analizar Lote</button>
            <button type="button" class="btn btn--map" @click="mostrarEnMapa" :disabled="!coordenadasRaw.trim()">🗺️ Ver en Mapa</button>
          </div>
        </form>
      </section>

      <!-- Mapa -->
      <section v-if="mostrarMapa" class="card"><div id="mapContainer"></div></section>

      <!-- Resultados -->
      <transition name="fade">
        <div v-if="errorMsg" class="card card--error">{{ errorMsg }}</div>
        <div v-else-if="resultadoData" class="card card--result">
          <div class="result-badge" :style="{ background: colorEstado + '22', color: colorEstado }">{{ resultadoData.veredicto }}</div>
          <p v-if="resultadoData.ubicacion">📍 {{ resultadoData.ubicacion.formatted }}</p>

          <!-- Métricas principales -->
          <div class="metric-group">
            <div class="metric">🌎<div class="metric__value">{{ resultadoData.areaTotal }} <span>ha</span></div><div class="metric__label">Superficie</div></div>
            <div class="metric">🔥<div class="metric__value">{{ resultadoData.deforestacion }} <span>ha</span></div><div class="metric__label">Deforestación total</div></div>
            <div class="metric">⏳<div class="metric__value">{{ resultadoData.deforestacionPost2020 }} <span>ha</span></div><div class="metric__label">Post‑2020</div></div>
            <div class="metric">🌿<div class="metric__value">{{ resultadoData.carbono }} <span>tCO₂e</span></div><div class="metric__label">Carbono</div></div>
          </div>

          <!-- Clima -->
          <div class="card" v-if="resultadoData.clima">
            <h3>🌤️ Clima Actual</h3>
            <p><strong>Temperatura:</strong> {{ resultadoData.clima.temperatura }} °C</p>
            <p><strong>Humedad:</strong> {{ resultadoData.clima.humedad }} %</p>
            <p><strong>Lluvia (3 días):</strong> {{ resultadoData.clima.precipitacion_3d }} mm</p>
          </div>

          <!-- Alertas -->
          <div class="card">
            <h3>🔥 Alertas y Restricciones</h3>
            <p><strong>Focos de Incendio Cercanos:</strong> {{ resultadoData.incendiosCercanos || 0 }}</p>
            <p><strong>Área Protegida:</strong>
              <span :class="resultadoData.areaProtegida?.intersecta ? 'text-danger' : 'text-success'">
                {{ resultadoData.areaProtegida?.intersecta ? 'Sí (Afectado)' : 'No (Libre)' }}
              </span>
            </p>
            <p v-if="resultadoData.calidadAire"><strong>Calidad del Aire (PM2.5):</strong> {{ resultadoData.calidadAire['PM2.5'] || 'Sin datos' }}</p>
            <p v-else><strong>Calidad del Aire:</strong> Sin datos disponibles</p>
          </div>

          <!-- Desglose anual -->
          <div v-if="resultadoData.perdidaPorAnio && Object.keys(resultadoData.perdidaPorAnio).length" class="loss-breakdown">
            <h4>📅 Pérdida de cobertura arbórea por año</h4>
            <table>
              <tr v-for="(ha, year) in resultadoData.perdidaPorAnio" :key="year">
                <td>{{ year === '0' ? 'Sin año' : year }}</td>
                <td>{{ ha }} ha</td>
              </tr>
            </table>
          </div>

          <!-- Token -->
          <div class="token-display"><strong>🔐 Token:</strong> <code>{{ resultadoData.complianceToken }}</code></div>

          <div class="result__actions">
            <button @click="generarReporteIA" class="btn btn--ai">🤖 IA</button>
            <button @click="generarReporteLocal" class="btn btn--primary">📋 TXT</button>
            <button @click="exportarCertificadoFormal" class="btn btn--primary">🎓 PDF</button>
          </div>
        </div>
      </transition>

      <!-- Modal dibujo -->
      <div v-if="modoDibujo" class="draw-modal-overlay">
        <div id="drawMapContainer" class="draw-modal-map"></div>
        <div class="draw-modal-actions">
          <button class="btn btn--confirm" @click="confirmarDibujo">✅ Confirmar</button>
          <button class="btn btn--cancel" @click="cerrarDibujo">❌ Cancelar</button>
        </div>
      </div>

      <!-- Tutorial -->
      <div v-if="tutorialActivo" class="tutorial-overlay" @click.stop="manejarClickOverlay">
        <div class="tutorial-tooltip" :style="tooltipStyle">
          <p>{{ pasos[pasoActual]?.texto }}</p>
          <div class="tutorial-nav">
            <button @click="anteriorPaso" :disabled="pasoActual===0">Anterior</button>
            <span>{{ pasoActual+1 }}/{{ pasos.length }}</span>
            <button @click="pasoActual===pasos.length-1 ? finalizarTutorial() : siguientePaso()">{{ pasoActual===pasos.length-1 ? 'Finalizar' : 'Siguiente' }}</button>
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

const productor=ref(''),email=ref(''),renspa=ref(''),cuit=ref(''),campaña=ref(''),producto=ref('')
const coordenadasRaw=ref(''),cargando=ref(false),errorMsg=ref(null),resultadoData=ref(null)
const mostrarMapa=ref(false),archivoCargado=ref(false),modoDibujo=ref(false)
const tutorialActivo=ref(false),pasoActual=ref(0),tooltipStyle=ref({})
const certificadoVisible=ref(false)

const mapaPrincipal = new MapManager('mapContainer')
let mapaDibujo=null, dibujoItems=null

const pasos=[{selector:"input[placeholder='Establecimiento']",texto:"1. Completá el nombre del productor."},{selector:"input[placeholder='correo@agro.com']",texto:"2. Ingresá un correo electrónico."},{selector:"input[placeholder='04.123.0.45678/00']",texto:"3. RENSPA."},{selector:"input[placeholder='20-34567890-9']",texto:"4. CUIT."},{selector:"input[placeholder='2025/2026']",texto:"5. Campaña."},{selector:"input[placeholder='Soja']",texto:"6. Producto."},{selector:".btn--draw",texto:"7. Dibujá el polígono."}]
const tutorial = new TutorialEngine(pasos, {onStateChange:(estado)=>{tutorialActivo.value=estado.activo;pasoActual.value=estado.pasoActual;tooltipStyle.value=estado.tooltipStyle},onClickElemento:()=>{}})
watch(tutorialActivo,val=>{document.body.style.overflow=val?'hidden':''})

function iniciarTutorial(){tutorial.iniciar()}
function manejarClickOverlay(e){tutorial.manejarClick(e)}
function siguientePaso(){tutorial.siguiente()}
function anteriorPaso(){tutorial.anterior()}
function finalizarTutorial(){tutorial.finalizar()}

function validarCoordenadas(raw){let l=raw.trim().replace(/\s*;\s*/g,';').replace(/\s*,\s*/g,',');let p=l.split(';');if(p.length<3)return null;for(let x of p){let[lat,lng]=x.split(',').map(Number);if(isNaN(lat)||isNaN(lng)||lat<-90||lat>90||lng<-180||lng>180)return null;}return l;}

const porcentajeDeforestacion=computed(()=>{if(!resultadoData.value)return 0;let d=parseFloat(resultadoData.value.deforestacion),t=parseFloat(resultadoData.value.areaTotal);return isNaN(d)||isNaN(t)||t<=0?0:Math.min(100,Math.round((d/t)*100))})
const colorEstado=computed(()=>{let p=porcentajeDeforestacion.value;return p===0?'#10b981':p<5?'#f59e0b':p<20?'#f97316':'#ef4444'})

function cargarKML(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=(ev)=>{try{coordenadasRaw.value=KmlParser.parse(ev.target.result);archivoCargado.value=true;errorMsg.value=null}catch(err){errorMsg.value='Error KML: '+err.message;archivoCargado.value=false}};r.readAsText(f)}

async function analizarLote(){
  errorMsg.value=null;resultadoData.value=null
  if(!productor.value||!email.value||!renspa.value||!cuit.value||!campaña.value||!producto.value){errorMsg.value='Complete todos los campos';return}
  let sanitizado=validarCoordenadas(coordenadasRaw.value)
  if(!sanitizado){errorMsg.value='Coordenadas inválidas';return}
  cargando.value=true
  try{
    let data=await ApiClient.analyze({coords:sanitizado,productor:productor.value,email:email.value,renspa:renspa.value,cuit:cuit.value,campaña:campaña.value,producto:producto.value})
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
      clima: data.clima,
      ubicacion: data.ubicacion,
      complianceToken: data.compliance_token,
      areaProtegida: data.area_protegida,
      perdidaPorAnio: data.perdida_por_anio
    }
  }catch(err){errorMsg.value=err.message}
  finally{cargando.value=false}
}

function mostrarEnMapa(){if(!coordenadasRaw.value.trim())return;mostrarMapa.value=true;nextTick(()=>{mapaPrincipal.initialize(coordenadasRaw);mapaPrincipal.drawPolygon(coordenadasRaw.value,colorEstado.value)})}
function generarReporteLocal(){if(!resultadoData.value)return;let r=`CERTIFICADO EUDR\nVeredicto: ${resultadoData.value.veredicto}\nToken: ${resultadoData.value.complianceToken}`;let b=new Blob([r],{type:'text/plain'});let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Certificado_TerraSentry.txt';a.click();URL.revokeObjectURL(a.href)}
function exportarCertificadoFormal(){if(!resultadoData.value)return;certificadoVisible.value=true;nextTick(()=>{let el=document.getElementById('certificado-formal');if(!el)return;html2pdf().set({margin:10,filename:'Certificado_TerraSentry.pdf'}).from(el).save();certificadoVisible.value=false})}
function abrirDibujo(){modoDibujo.value=true;nextTick(()=>{if(mapaDibujo)mapaDibujo.remove();mapaDibujo=L.map('drawMapContainer',{zoomControl:true,attributionControl:false}).setView([-33.12,-64.35],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaDibujo);dibujoItems=new L.FeatureGroup();mapaDibujo.addLayer(dibujoItems);new L.Control.Draw({position:'topright',draw:{polygon:{allowIntersection:false,shapeOptions:{color:'#10b981'}},polyline:false,circle:false,rectangle:false,marker:false},edit:false}).addTo(mapaDibujo);mapaDibujo.on(L.Draw.Event.CREATED,(ev)=>{dibujoItems.clearLayers();dibujoItems.addLayer(ev.layer)})})}
function confirmarDibujo(){if(!dibujoItems||dibujoItems.getLayers().length===0){errorMsg.value='Dibuje un polígono';return}let layer=dibujoItems.getLayers()[0];if(layer instanceof L.Polygon)coordenadasRaw.value=layer.getLatLngs()[0].map(ll=>`${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ');cerrarDibujo()}
function cerrarDibujo(){if(mapaDibujo){mapaDibujo.remove();mapaDibujo=null;dibujoItems=null}modoDibujo.value=false}
async function generarReporteIA(){}
onUnmounted(()=>{if(mapaDibujo)mapaDibujo.remove()})
</script>

<style>
@import './styles.css';
@import 'leaflet/dist/leaflet.css';
@import 'leaflet-draw/dist/leaflet.draw.css';
.app{display:flex;flex-direction:column;min-height:100vh}.main{flex:1;width:100%;padding:1rem;max-width:1200px;margin:0 auto}
#mapContainer{height:400px;border-radius:12px}
.draw-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:2000;display:flex;flex-direction:column}
.draw-modal-map{flex:1}.draw-modal-actions{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:1rem}
.loss-breakdown{background:#1e293b;border-radius:8px;padding:0.75rem;margin:1rem 0}
.loss-breakdown table{width:100%;border-collapse:collapse}.loss-breakdown td{padding:0.25rem 0.5rem;border-bottom:1px solid #334155}
.token-display{background:#1e293b;border-radius:8px;padding:0.75rem;margin:1rem 0;font-family:monospace}
.text-danger{color:#ef4444;font-weight:bold}.text-success{color:#10b981;font-weight:bold}
</style>
