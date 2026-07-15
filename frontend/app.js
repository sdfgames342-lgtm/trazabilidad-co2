const { createApp, ref, nextTick, computed, onUnmounted } = Vue;

const app = createApp({
  setup() {
    // --- Estado reactivo ---
    const productor = ref(''), email = ref(''), renspa = ref(''), cuit = ref(''), campaña = ref(''), producto = ref('');
    const coordenadasRaw = ref(''), cargando = ref(false), errorMsg = ref(null), resultadoData = ref(null);
    const anioActual = ref(new Date().getFullYear()), mostrarMapa = ref(false), archivoCargado = ref(false);
    const anonimizarKML = ref(false), posibleSwap = ref(false), fueraDeCordoba = ref(false);
    const kmlFileInput = ref(null), modoDibujo = ref(false);

    // --- Servicios ---
    const mapaPrincipal = new MapManager('mapContainer');
    let mapaDibujo = null;
    let dibujoItems = null;

    // --- Tutorial ---
    const tutorialActivo = ref(false), pasoActual = ref(0);
    const tutorial = new TutorialEngine(pasos, {
      onStateChange: (estado) => {
        tutorialActivo.value = estado.activo;
        pasoActual.value = estado.pasoActual;
        tooltipStyle.value = estado.tooltipStyle;
      },
      onClickElemento: () => {}
    });

    // --- Computed ---
    const porcentajeDeforestacion = computed(() => {
      if (!resultadoData.value) return 0;
      const d = parseFloat(resultadoData.value.deforestacion), t = parseFloat(resultadoData.value.areaTotal);
      return isNaN(d)||isNaN(t)||t<=0 ? 0 : Math.min(100, Math.round((d/t)*100));
    });
    const colorEstado = computed(() => {
      const p = porcentajeDeforestacion.value;
      return p===0?'#10b981':p<5?'#f59e0b':p<20?'#f97316':'#ef4444';
    });

    // --- Métodos ---
    function cargarKML(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try { coordenadasRaw.value = KmlParser.parse(e.target.result); archivoCargado.value = true; errorMsg.value = null; }
        catch (err) { errorMsg.value = 'Error al procesar KML: ' + err.message; archivoCargado.value = false; }
      };
      reader.readAsText(file);
    }

    function descargarKML() {
      if (!coordenadasRaw.value.trim()) { errorMsg.value = 'No hay coordenadas para generar KML'; return; }
      const nombre = productor.value || 'Establecimiento';
      const datos = resultadoData.value ? { areaTotal:resultadoData.value.areaTotal, deforestacion:resultadoData.value.deforestacion, carbono:resultadoData.value.carbono, indiceVerde:resultadoData.value.indiceVerde, veredicto:resultadoData.value.veredicto } : null;
      const kml = KmlParser.generate(coordenadasRaw.value, nombre, datos);
      const blob = new Blob([kml], {type:'application/vnd.google-earth.kml+xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${nombre.replace(/\s+/g,'_')}.kml`; a.click();
      URL.revokeObjectURL(url);
    }

    async function analizarLote() {
      errorMsg.value = null; resultadoData.value = null;
      if (!productor.value || !email.value || !renspa.value || !cuit.value || !campaña.value || !producto.value) {
        errorMsg.value = 'Complete todos los campos obligatorios'; return;
      }
      const sanitizado = validarCoordenadas(coordenadasRaw.value);
      if (!sanitizado) { errorMsg.value = 'Formato de coordenadas incorrecto'; return; }
      cargando.value = true;
      try {
        const data = await ApiClient.analyze({
          coords: sanitizado, productor: productor.value, email: email.value,
          renspa: renspa.value, cuit: cuit.value, campaña: campaña.value, producto: producto.value
        });
        resultadoData.value = {
          areaTotal: data.area_total_ha, deforestacion: Math.min(data.deforestacion_ha, data.area_total_ha),
          carbono: data.carbono_ton, gananciaBosque: data.ganancia_bosque_ha, bosqueBasal: data.bosque_basal_ha,
          indiceVerde: data.indice_verde, veredicto: data.veredicto, dentroCordoba: data.dentro_cordoba,
          centroidLat: data.centroid_lat, centroidLon: data.centroid_lon,
          calidadAire: data.calidad_aire, incendiosCercanos: data.incendios_cercanos, sismos: data.sismos_cercanos,
          temperatura: data.clima?.temperatura ?? '—', humedad: data.clima?.humedad ?? '—', lluvia: data.clima?.precipitacion_3d ?? '—',
          ubicacion: data.ubicacion?.formatted ?? '—', clima: data.clima, statusMonitoreo: data.status_monitoreo
        };
        if (mostrarMapa.value) { await nextTick(); mapaPrincipal.initialize(coordenadasRaw); mapaPrincipal.drawPolygon(sanitizado, colorEstado.value); mapaPrincipal.setView(data.centroid_lat, data.centroid_lon); }
      } catch (err) { errorMsg.value = err.message; }
      finally { cargando.value = false; }
    }

    async function mostrarEnMapa() {
      if (!coordenadasRaw.value.trim()) { errorMsg.value = 'Ingrese coordenadas primero'; return; }
      try {
        const sanitizado = validarCoordenadas(coordenadasRaw.value);
        if (!sanitizado) throw new Error('Coordenadas inválidas');
        mostrarMapa.value = true; await nextTick();
        mapaPrincipal.initialize(coordenadasRaw);
        mapaPrincipal.drawPolygon(sanitizado, colorEstado.value);
      } catch (err) { errorMsg.value = `Error en mapa: ${err.message}`; }
    }

    function generarReporteLocal() {
      if (!resultadoData.value) return;
      const reporte = `=====================================================\n          CERTIFICADO DE TRAZABILIDAD REGULATORIA - EUDR\n=====================================================\nFecha: ${new Date().toISOString()}\nEstablecimiento: ${productor.value}\nCUIT: ${cuit.value} | RENSPA: ${renspa.value}\nCampaña: ${campaña.value} | Producto: ${producto.value}\n\nDICTAMEN: ${resultadoData.value.veredicto.toUpperCase()}\nÍndice Verde: ${resultadoData.value.indiceVerde}\n\nSuperficie: ${resultadoData.value.areaTotal} ha\nDeforestación: ${resultadoData.value.deforestacion} ha\nCarbono: ${resultadoData.value.carbono} tCO₂e\nAfectación: ${porcentajeDeforestacion.value}%\n\nNodo de Monitoreo Global: TerraSentry Core-Engine\n=====================================================`;
      const blob = new Blob([reporte], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Certificado_${productor.value.replace(/\s+/g,'_')}.txt`; a.click();
      URL.revokeObjectURL(url);
    }

    async function generarReporteIA() {
      if (!resultadoData.value) return;
      try {
        const data = await ApiClient.reporteIA({
          producto: producto.value, area_total_ha: resultadoData.value.areaTotal,
          deforestacion_ha: resultadoData.value.deforestacion, carbono_ton: resultadoData.value.carbono,
          clima: { temperatura: resultadoData.value.temperatura, humedad: resultadoData.value.humedad, precipitacion_3d: resultadoData.value.lluvia },
          incendios_cercanos: resultadoData.value.incendiosCercanos, sismos_cercanos: resultadoData.value.sismos,
          ubicacion: { formatted: resultadoData.value.ubicacion }, veredicto: resultadoData.value.veredicto
        });
        if (data.ingresos) resultadoData.value.ingresos = data.ingresos;
        if (data.analisis_ia) resultadoData.value.analisisIA = data.analisis_ia;
      } catch(e) { errorMsg.value = 'Error al generar reporte IA: ' + e.message; }
    }

    function abrirDibujo() {
      modoDibujo.value = true;
      nextTick(() => {
        mapaDibujo = L.map('drawMapContainer', {zoomControl:true, attributionControl:false}).setView([-33.12, -64.35], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap', maxZoom:19}).addTo(mapaDibujo);
        dibujoItems = new L.FeatureGroup(); mapaDibujo.addLayer(dibujoItems);
        const drawControl = new L.Control.Draw({
          position:'topright', draw:{ polygon:{ allowIntersection:false, drawError:{color:'#ef4444',message:'<strong>¡No cruces las líneas!</strong>'}, shapeOptions:{color:'#10b981'} }, polyline:false, circle:false, rectangle:false, marker:false, circlemarker:false }, edit:false
        });
        mapaDibujo.addControl(drawControl);
        mapaDibujo.on(L.Draw.Event.CREATED, (e) => { dibujoItems.clearLayers(); dibujoItems.addLayer(e.layer); });
      });
    }

    function confirmarDibujo() {
      if (!dibujoItems || dibujoItems.getLayers().length === 0) { errorMsg.value = 'Debe dibujar un polígono.'; return; }
      const layer = dibujoItems.getLayers()[0];
      if (layer instanceof L.Polygon) coordenadasRaw.value = layer.getLatLngs()[0].map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ');
      cerrarDibujo();
    }

    function cerrarDibujo() {
      if (mapaDibujo) { mapaDibujo.remove(); mapaDibujo = null; dibujoItems = null; }
      modoDibujo.value = false;
    }

    onUnmounted(() => { if (mapaDibujo) mapaDibujo.remove(); });

    // Exponer para Leaflet
      get coordenadasRaw() { return coordenadasRaw.value; },
      set coordenadasRaw(val) { coordenadasRaw.value = val; }
    };

    function siguientePaso() { tutorial.siguiente(); }
    function anteriorPaso() { tutorial.anterior(); }
    function finalizarTutorial() { tutorial.finalizar(); }
    return {
      productor, email, renspa, cuit, campaña, producto, coordenadasRaw,
      cargando, errorMsg, resultadoData, anioActual, mostrarMapa,
      archivoCargado, anonimizarKML, kmlFileInput,
      posibleSwap, fueraDeCordoba,
      porcentajeDeforestacion, colorEstado,
      cargarKML, descargarKML, analizarLote, mostrarEnMapa, generarReporteLocal, generarReporteIA,
      modoDibujo, abrirDibujo, confirmarDibujo, cerrarDibujo,
      tutorialActivo, pasoActual, pasos, iniciarTutorial: tutorial.iniciar.bind(tutorial),
      siguientePaso,
      anteriorPaso,
      finalizarTutorial,
      manejarClickOverlay: tutorial.manejarClick.bind(tutorial), tooltipStyle
    };
  }
});

// Función de validación auxiliar
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

app.mount('#app');
