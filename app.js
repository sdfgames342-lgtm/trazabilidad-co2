const { createApp, ref, nextTick, computed, onUnmounted } = Vue;

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

// ---------- Mapa ----------
let mapInstance = null, polygonLayer = null, emergencyLayerGroup = null, drawnItems = null;

function inicializarMapa() {
  if (mapInstance) return;
  mapInstance = L.map('mapContainer').setView([-33.12, -64.35], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap', maxZoom:19}).addTo(mapInstance);
  L.tileLayer.wms("https://geoservicios.conae.gov.ar/geoserver/ows", { layers:"focos_calor", format:"image/png", transparent:true, attribution:"CONAE", opacity:0.7 }).addTo(mapInstance);
  emergencyLayerGroup = L.layerGroup().addTo(mapInstance);
  drawnItems = new L.FeatureGroup(); mapInstance.addLayer(drawnItems);
  const drawControl = new L.Control.Draw({
    position:'topleft',
    draw:{ polygon:{ allowIntersection:false, drawError:{color:'#ef4444',message:'<strong>¡No cruces las líneas!</strong>'}, shapeOptions:{color:'#10b981'} }, polyline:false, circle:false, rectangle:false, marker:false, circlemarker:false },
    edit:{ featureGroup:drawnItems, remove:true }
  });
  mapInstance.addControl(drawControl);
  mapInstance.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers(); drawnItems.addLayer(e.layer);
    const coordStr = e.layer.getLatLngs()[0].map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ');
    if (window.__vueApp) window.__vueApp.coordenadasRaw = coordStr;
  });
  conectarRedMonitoreoGlobal();
}

async function conectarRedMonitoreoGlobal() {
  try {
    const resp = await fetch('/api/emergency-layers');
    if (resp.ok) {
      const datos = await resp.json();
      emergencyLayerGroup.clearLayers();
      datos.forEach(item => {
        if (!item.lat || !item.lng) return;
        const color = {instalacion_peligrosa:'orange',contaminacion:'purple',incendio:'red',sismo:'brown'}[item.category] || 'gray';
        L.circleMarker([item.lat, item.lng], {radius:6, color, fillColor:color, fillOpacity:0.6})
          .addTo(emergencyLayerGroup).bindPopup(`${item.type||item.category}<br>${item.valor||''} ${item.unidad||''}`);
      });
    }
    fetch('https://alertas-smn.api.gob.ar/v1/alertas/geojson')
      .then(r => r.json())
      .then(data => {
        L.geoJSON(data, {style: f => ({color: f.properties.nivel==='rojo'?'#dc2626':f.properties.nivel==='naranja'?'#f97316':'#facc15', weight:2, fillOpacity:0.2})})
          .addTo(emergencyLayerGroup);
      }).catch(e => console.warn('SMN alertas:', e));
  } catch(e) { console.warn('Red monitoreo:', e); }
}

function dibujarPoligono(coordenadasTexto, colorAlerta = '#2a7f6e') {
  if (polygonLayer) mapInstance.removeLayer(polygonLayer);
  const puntos = coordenadasTexto.split(';').map(p => p.trim().split(',').map(Number));
  if (puntos.length >= 3) {
    polygonLayer = L.polygon(puntos, {color:colorAlerta, weight:4, fillColor:colorAlerta, fillOpacity:0.35}).addTo(mapInstance);
    mapInstance.fitBounds(polygonLayer.getBounds());
  }
}

// ---------- KML ----------
function parsearKML(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const placemarks = xml.querySelectorAll('Placemark');
  for (let pm of placemarks) {
    const coords = pm.querySelector('Polygon coordinates');
    if (coords) {
      const puntos = coords.textContent.trim().split(/\s+/).filter(s => s.length);
      if (puntos.length < 3) continue;
      const resultado = puntos.map(p => {
        const [lon, lat] = p.split(',').map(Number);
        return `${lat},${lon}`;
      });
      if (resultado.length > 1 && resultado[0] === resultado[resultado.length-1]) resultado.pop();
      if (resultado.length >= 3) return resultado.join('; ');
    }
  }
  throw new Error('No se encontró un polígono válido en el KML');
}

function generarKML(coordenadasTexto, nombre, datosAdicionales = null) {
  const pares = coordenadasTexto.split(';').map(p => p.trim().split(',').map(Number));
  const puntos = pares.map(([lat, lon]) => [lon, lat]);
  if (puntos.length && (puntos[0][0] !== puntos[puntos.length-1][0] || puntos[0][1] !== puntos[puntos.length-1][1])) puntos.push([...puntos[0]]);
  const coordsStr = puntos.map(p => p.join(',')+',0').join(' ');
  let descripcion = 'Polígono generado desde TerraSentry';
  if (datosAdicionales) {
    descripcion = `<![CDATA[<div style="font-family:sans-serif"><h3>Resultados EUDR</h3><ul><li>Superficie: ${datosAdicionales.areaTotal} ha</li><li>Deforestación: ${datosAdicionales.deforestacion} ha</li><li>Carbono: ${datosAdicionales.carbono} tCO₂e</li><li>Índice: ${datosAdicionales.indiceVerde}</li><li>Veredicto: ${datosAdicionales.veredicto}</li></ul></div>]]>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>TerraSentry</name><Placemark><name>${nombre||'Lote'}</name><description>${descripcion}</description><Polygon><outerBoundaryIs><LinearRing><coordinates>${coordsStr}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`;
}

// ---------- Vue App ----------
const app = createApp({
  setup() {
    const productor = ref(''), email = ref(''), renspa = ref(''), cuit = ref(''), campaña = ref(''), producto = ref('');
    const coordenadasRaw = ref(''), cargando = ref(false), errorMsg = ref(null), resultadoData = ref(null);
    const anioActual = ref(new Date().getFullYear()), mostrarMapa = ref(false), archivoCargado = ref(false);
    const anonimizarKML = ref(false), posibleSwap = ref(false), fueraDeCordoba = ref(false);
    const kmlFileInput = ref(null), modoDibujo = ref(false);
    let drawMapInstance = null, drawDrawnItems = null;

    // Tutorial simplificado (7 pasos, sin dibujo ni confirmación)
    const tutorialActivo = ref(false);
    const pasoActual = ref(0);
    const pasos = [
      { selector: "input[placeholder='Establecimiento Don Juan']", texto: "1. Completá el nombre del productor." },
      { selector: "input[placeholder='contacto@agro.com']", texto: "2. Ingresá un correo electrónico de contacto." },
      { selector: "input[placeholder='04.123.0.45678/00']", texto: "3. Número de RENSPA del establecimiento." },
      { selector: "input[placeholder='20-34567890-9']", texto: "4. CUIT o CUIL del productor." },
      { selector: "input[placeholder='2025/2026']", texto: "5. Campaña actual." },
      { selector: "input[placeholder='Soja']", texto: "6. Producto principal." },
      { selector: ".btn--draw", texto: "7. Hacé clic en DIBUJA para dibujar el polígono. Luego analizá el lote." }
    ];
    let elementoResaltado = null;

    const iniciarTutorial = () => { tutorialActivo.value = true; pasoActual.value = 0; nextTick(() => resaltarPaso(0)); };
    const resaltarPaso = (index) => {
      if (elementoResaltado) elementoResaltado.classList.remove("tutorial-highlight");
      const el = document.querySelector(pasos[index].selector);
      if (el) { el.classList.add("tutorial-highlight"); el.scrollIntoView({behavior:"smooth", block:"center"}); elementoResaltado = el; }
    };
    const manejarClickOverlay = (event) => {
      if (!elementoResaltado) return;
      const rect = elementoResaltado.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      if (pasos[pasoActual.value].selector === ".btn--draw" && !modoDibujo.value) abrirDibujo();
      if (pasoActual.value < pasos.length - 1) { pasoActual.value++; nextTick(() => resaltarPaso(pasoActual.value)); }
      else finalizarTutorial();
    };
    const finalizarTutorial = () => {
      if (elementoResaltado) elementoResaltado.classList.remove("tutorial-highlight");
      tutorialActivo.value = false; pasoActual.value = 0; elementoResaltado = null;
    };

    const tooltipStyle = computed(() => {
      if (!elementoResaltado) return {};
      const r = elementoResaltado.getBoundingClientRect();
      return { top: r.bottom + 10 + 'px', left: r.left + r.width/2 + 'px', transform: 'translateX(-50%)' };
    });

    window.__vueApp = {
      get coordenadasRaw() { return coordenadasRaw.value; },
      set coordenadasRaw(val) { coordenadasRaw.value = val; }
    };

    const porcentajeDeforestacion = computed(() => {
      if (!resultadoData.value) return 0;
      const d = parseFloat(resultadoData.value.deforestacion), t = parseFloat(resultadoData.value.areaTotal);
      return isNaN(d)||isNaN(t)||t<=0 ? 0 : Math.min(100, Math.round((d/t)*100));
    });
    const colorEstado = computed(() => {
      const p = porcentajeDeforestacion.value;
      return p===0?'#10b981':p<5?'#f59e0b':p<20?'#f97316':'#ef4444';
    });

    const cargarKML = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try { coordenadasRaw.value = parsearKML(e.target.result); archivoCargado.value = true; errorMsg.value = null; }
        catch (err) { errorMsg.value = 'Error al procesar KML: ' + err.message; archivoCargado.value = false; }
      };
      reader.readAsText(file);
    };

    const descargarKML = () => {
      if (!coordenadasRaw.value.trim()) { errorMsg.value = 'No hay coordenadas para generar KML'; return; }
      const nombre = productor.value || 'Establecimiento';
      const datos = resultadoData.value ? { areaTotal:resultadoData.value.areaTotal, deforestacion:resultadoData.value.deforestacion, carbono:resultadoData.value.carbono, indiceVerde:resultadoData.value.indiceVerde, veredicto:resultadoData.value.veredicto } : null;
      const kml = generarKML(coordenadasRaw.value, nombre, datos);
      const blob = new Blob([kml], {type:'application/vnd.google-earth.kml+xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${nombre.replace(/\s+/g,'_')}.kml`; a.click();
      URL.revokeObjectURL(url);
    };

    const analizarLote = async () => {
      errorMsg.value = null; resultadoData.value = null;
      if (!productor.value || !email.value || !renspa.value || !cuit.value || !campaña.value || !producto.value) {
        errorMsg.value = 'Complete todos los campos obligatorios'; return;
      }
      const sanitizado = validarCoordenadas(coordenadasRaw.value);
      if (!sanitizado) { errorMsg.value = 'Formato de coordenadas incorrecto'; return; }
      cargando.value = true;
      try {
        const resp = await fetch('/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({coords:sanitizado, productor:productor.value, email:email.value, renspa:renspa.value, cuit:cuit.value, campaña:campaña.value, producto:producto.value}) });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Error del servidor');
        resultadoData.value = {
          areaTotal: data.area_total_ha, deforestacion: Math.min(data.deforestacion_ha, data.area_total_ha),
          carbono: data.carbono_ton, gananciaBosque: data.ganancia_bosque_ha, bosqueBasal: data.bosque_basal_ha,
          indiceVerde: data.indice_verde, veredicto: data.veredicto, dentroCordoba: data.dentro_cordoba,
          centroidLat: data.centroid_lat, centroidLon: data.centroid_lon,
          calidadAire: data.calidad_aire, incendiosCercanos: data.incendios_cercanos, sismos: data.sismos_cercanos,
          temperatura: data.clima?.temperatura ?? '—', humedad: data.clima?.humedad ?? '—', lluvia: data.clima?.precipitacion_3d ?? '—',
          ubicacion: data.ubicacion?.formatted ?? '—', clima: data.clima, statusMonitoreo: data.status_monitoreo
        };
        if (mostrarMapa.value) { await nextTick(); inicializarMapa(); dibujarPoligono(sanitizado, colorEstado.value); if (mapInstance && data.centroid_lat) mapInstance.setView([data.centroid_lat, data.centroid_lon], 13); }
      } catch (err) { errorMsg.value = err.message; }
      finally { cargando.value = false; }
    };

    const mostrarEnMapa = async () => {
      if (!coordenadasRaw.value.trim()) { errorMsg.value = 'Ingrese coordenadas primero'; return; }
      try {
        const sanitizado = validarCoordenadas(coordenadasRaw.value);
        if (!sanitizado) throw new Error('Coordenadas inválidas');
        mostrarMapa.value = true; await nextTick(); inicializarMapa(); dibujarPoligono(sanitizado, colorEstado.value);
      } catch (err) { errorMsg.value = `Error en mapa: ${err.message}`; }
    };

    const generarReporteLocal = () => {
      if (!resultadoData.value) return;
      const reporte = `=====================================================\n          CERTIFICADO DE TRAZABILIDAD REGULATORIA - EUDR\n=====================================================\nFecha: ${new Date().toISOString()}\nEstablecimiento: ${productor.value}\nCUIT: ${cuit.value} | RENSPA: ${renspa.value}\nCampaña: ${campaña.value} | Producto: ${producto.value}\n\nDICTAMEN: ${resultadoData.value.veredicto.toUpperCase()}\nÍndice Verde: ${resultadoData.value.indiceVerde}\n\nSuperficie: ${resultadoData.value.areaTotal} ha\nDeforestación: ${resultadoData.value.deforestacion} ha\nCarbono: ${resultadoData.value.carbono} tCO₂e\nAfectación: ${porcentajeDeforestacion.value}%\n\nNodo de Monitoreo Global: TerraSentry Core-Engine\n=====================================================`;
      const blob = new Blob([reporte], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Certificado_${productor.value.replace(/\s+/g,'_')}.txt`; a.click();
      URL.revokeObjectURL(url);
    };

    const generarReporteIA = async () => {
      if (!resultadoData.value) return;
      try {
        const resp = await fetch('/reporte-ia', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
          producto: producto.value, area_total_ha: resultadoData.value.areaTotal,
          deforestacion_ha: resultadoData.value.deforestacion, carbono_ton: resultadoData.value.carbono,
          clima: { temperatura: resultadoData.value.temperatura, humedad: resultadoData.value.humedad, precipitacion_3d: resultadoData.value.lluvia },
          incendios_cercanos: resultadoData.value.incendiosCercanos, sismos_cercanos: resultadoData.value.sismos,
          ubicacion: { formatted: resultadoData.value.ubicacion }, veredicto: resultadoData.value.veredicto
        }) });
        const data = await resp.json();
        if (data.ingresos) resultadoData.value.ingresos = data.ingresos;
        if (data.analisis_ia) resultadoData.value.analisisIA = data.analisis_ia;
      } catch(e) { errorMsg.value = 'Error al generar reporte IA: ' + e.message; }
    };

    // Modal de dibujo
    const abrirDibujo = async () => {
      modoDibujo.value = true; await nextTick();
      drawMapInstance = L.map('drawMapContainer', {zoomControl:true, attributionControl:false}).setView([-33.12, -64.35], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap', maxZoom:19}).addTo(drawMapInstance);
      drawDrawnItems = new L.FeatureGroup(); drawMapInstance.addLayer(drawDrawnItems);
      const drawControl = new L.Control.Draw({
        position:'topright', draw:{ polygon:{ allowIntersection:false, drawError:{color:'#ef4444',message:'<strong>¡No cruces las líneas!</strong>'}, shapeOptions:{color:'#10b981'} }, polyline:false, circle:false, rectangle:false, marker:false, circlemarker:false }, edit:false
      });
      drawMapInstance.addControl(drawControl);
      drawMapInstance.on(L.Draw.Event.CREATED, (e) => { drawDrawnItems.clearLayers(); drawDrawnItems.addLayer(e.layer); });
    };
    const confirmarDibujo = () => {
      if (!drawDrawnItems || drawDrawnItems.getLayers().length === 0) { errorMsg.value = 'Debe dibujar un polígono.'; return; }
      const layer = drawDrawnItems.getLayers()[0];
      if (layer instanceof L.Polygon) coordenadasRaw.value = layer.getLatLngs()[0].map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ');
      cerrarDibujo();
    };
    const cerrarDibujo = () => {
      if (drawMapInstance) { drawMapInstance.remove(); drawMapInstance = null; drawDrawnItems = null; }
      modoDibujo.value = false;
    };
    onUnmounted(() => { if (drawMapInstance) drawMapInstance.remove(); });

    return {
      productor, email, renspa, cuit, campaña, producto, coordenadasRaw,
      cargando, errorMsg, resultadoData, anioActual, mostrarMapa,
      archivoCargado, anonimizarKML, kmlFileInput,
      posibleSwap, fueraDeCordoba,
      porcentajeDeforestacion, colorEstado,
      cargarKML, descargarKML, analizarLote, mostrarEnMapa, generarReporteLocal, generarReporteIA,
      modoDibujo, abrirDibujo, confirmarDibujo, cerrarDibujo,
      tutorialActivo, pasoActual, pasos, iniciarTutorial, manejarClickOverlay, tooltipStyle
    };
  }
});
app.mount('#app');
