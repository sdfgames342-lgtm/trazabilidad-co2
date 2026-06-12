const { createApp, ref, nextTick } = Vue;

// ----- Validación de coordenadas (mismo formato que antes) -----
function validarCoordenadas(raw) {
  let limpio = raw.trim().replace(/\s*;\s*/g, ';').replace(/\s*,\s*/g, ',');
  const partes = limpio.split(';');
  if (partes.length < 3) return null;
  for (let p of partes) {
    const coords = p.split(',');
    if (coords.length !== 2) return null;
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  }
  return limpio;
}

// ----- Mapa (Leaflet) -----
let mapInstance = null;
let polygonLayer = null;

function inicializarMapa() {
  if (mapInstance) return;
  mapInstance = L.map('mapContainer').setView([-33.12, -64.35], 13);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  }).addTo(mapInstance);
}

function dibujarPoligono(coordenadasTexto) {
  if (polygonLayer) mapInstance.removeLayer(polygonLayer);
  const pares = coordenadasTexto.split(';').map(p => p.trim());
  const puntos = [];
  for (let par of pares) {
    const [lat, lng] = par.split(',').map(Number);
    puntos.push([lat, lng]);
  }
  if (puntos.length >= 3) {
    polygonLayer = L.polygon(puntos, { color: '#2a7f6e', weight: 4, fillColor: '#2a7f6e', fillOpacity: 0.4 }).addTo(mapInstance);
    mapInstance.fitBounds(polygonLayer.getBounds());
  }
}

// ----- App Vue -----
createApp({
  setup() {
    const productor = ref('');
    const email = ref('');
    const renspa = ref('');
    const cuit = ref('');
    const campaña = ref('');
    const producto = ref('');
    const coordenadasRaw = ref('');
    const cargando = ref(false);
    const errorMsg = ref(null);
    const resultadoData = ref(null);
    const anioActual = ref(new Date().getFullYear());
    const mostrarMapa = ref(false);
    // Cambiar por la URL real del backend (cuando uses Cloudflare o local)
    const apiUrl = ref('https://filter-dimension-traveler-shirt.trycloudflare.com'); // ← reemplazar

    const analizarLote = async () => {
      errorMsg.value = null;
      resultadoData.value = null;

      if (!productor.value.trim()) { errorMsg.value = 'Complete el productor'; return; }
      if (!email.value.trim()) { errorMsg.value = 'Complete el email'; return; }
      if (!renspa.value.trim()) { errorMsg.value = 'Complete RENSPA'; return; }
      if (!cuit.value.trim()) { errorMsg.value = 'Complete CUIT'; return; }
      if (!campaña.value.trim()) { errorMsg.value = 'Complete campaña'; return; }
      if (!producto.value.trim()) { errorMsg.value = 'Complete producto'; return; }
      const sanitizado = validarCoordenadas(coordenadasRaw.value);
      if (!sanitizado) { errorMsg.value = 'Formato de coordenadas inválido'; return; }

      cargando.value = true;
      try {
        const response = await fetch(apiUrl.value + '/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coords: sanitizado,
            productor: productor.value.trim(),
            email: email.value.trim(),
            renspa: renspa.value.trim(),
            cuit: cuit.value.trim(),
            campaña: campaña.value.trim(),
            producto: producto.value.trim()
          })
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Error en el servidor');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        // Aquí el backend no devuelve área ni deforestación en texto, pero podemos parsear nombres o mostrar mensaje.
        // Como no tenemos esos datos en la respuesta, mostramos un mensaje genérico.
        resultadoData.value = {
          veredicto: 'Informe generado correctamente',
          areaHa: '—',
          deforestacion: 'Ver archivo ZIP',
          urlDescarga: url
        };
      } catch (err) {
        errorMsg.value = err.message;
      } finally {
        cargando.value = false;
      }
    };

    const mostrarEnMapa = async () => {
      if (!coordenadasRaw.value.trim()) {
        errorMsg.value = 'Ingrese coordenadas para mostrar en el mapa';
        return;
      }
      try {
        const sanitizado = validarCoordenadas(coordenadasRaw.value);
        if (!sanitizado) throw new Error('Coordenadas inválidas');
        mostrarMapa.value = true;
        await nextTick();
        inicializarMapa();
        dibujarPoligono(sanitizado);
      } catch (err) {
        errorMsg.value = `Error en mapa: ${err.message}`;
      }
    };

    return {
      productor, email, renspa, cuit, campaña, producto, coordenadasRaw,
      cargando, errorMsg, resultadoData, anioActual, mostrarMapa,
      analizarLote, mostrarEnMapa
    };
  }
}).mount('#app');
