const { createApp, ref, computed } = Vue;

// ========== Funciones de cálculo local ==========
function calcularAreaHectareas(coordenadas) {
  if (!coordenadas || coordenadas.length < 3) return 0;
  const R = 6371000;
  let total = 0;
  const n = coordenadas.length;
  const puntos = coordenadas.map(p => {
    const latRad = p.lat * Math.PI / 180;
    const lonRad = p.lng * Math.PI / 180;
    const x = R * Math.cos(latRad) * lonRad;
    const y = R * latRad;
    return { x, y };
  });
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    total += puntos[i].x * puntos[j].y - puntos[j].x * puntos[i].y;
  }
  const areaM2 = Math.abs(total) / 2;
  return areaM2 / 10000;
}

function parsearCoordenadas(texto) {
  if (!texto.trim()) throw new Error("Ingrese coordenadas del polígono.");
  const pares = texto.split(';').map(p => p.trim()).filter(p => p);
  if (pares.length < 3) throw new Error("Mínimo 3 puntos para un polígono.");
  const coordenadas = [];
  for (let par of pares) {
    const partes = par.split(',').map(v => v.trim());
    if (partes.length !== 2) throw new Error(`Formato inválido: "${par}"`);
    const lat = parseFloat(partes[0]);
    const lng = parseFloat(partes[1]);
    if (isNaN(lat) || isNaN(lng)) throw new Error(`No numérico: "${par}"`);
    if (lat < -90 || lat > 90) throw new Error(`Latitud fuera de rango: ${lat}`);
    if (lng < -180 || lng > 180) throw new Error(`Longitud fuera de rango: ${lng}`);
    coordenadas.push({ lat, lng });
  }
  return coordenadas;
}

function generarResultadoVerde(areaHa) {
  const factorCarbono = 185;
  let co2Ton = areaHa * factorCarbono;
  co2Ton = Math.round(co2Ton * 10) / 10;
  let veredicto = "", indiceVerde = "";
  if (areaHa <= 0.01) {
    veredicto = "Área mínima · sin impacto significativo";
    indiceVerde = "🌱 preliminar";
  } else if (areaHa < 1.5) {
    veredicto = "Micro-parcela carbono · potencial de regeneración";
    indiceVerde = "🟢 promisorio";
  } else if (areaHa < 10) {
    veredicto = "Desarrollo verde positivo · sumidero activo";
    indiceVerde = "🟢🌿 alto potencial";
  } else if (areaHa < 50) {
    veredicto = "Corredor biológico · créditos de carbono viables";
    indiceVerde = "🌟🌟 verde sostenible";
  } else {
    veredicto = "Macro proyecto carbono · reserva estratégica climática";
    indiceVerde = "🏆 carbono+";
  }
  if (co2Ton > 2000) veredicto = "🌳🌳 " + veredicto + " · impacto alto en mitigación";
  return { veredicto, co2Ton, areaHa: Math.round(areaHa * 1000) / 1000, indiceVerde };
}

function addRippleEffect(event) {
  const btn = event.currentTarget;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  const x = event.clientX - rect.left - size/2;
  const y = event.clientY - rect.top - size/2;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 500);
}

// ========== App Vue ==========
createApp({
  setup() {
    const coordenadasRaw = ref("");
    const productor = ref("");
    const email = ref("");
    const campaña = ref("");
    const cargando = ref(false);
    const errorMsg = ref(null);
    const resultadoData = ref(null);
    const anioActual = ref(new Date().getFullYear());

    const carbonPercent = computed(() => {
      if (!resultadoData.value) return 0;
      const co2 = resultadoData.value.co2Ton || 0;
      const maxCo2 = 3000;
      const percent = Math.min(100, (co2 / maxCo2) * 100);
      return Math.round(percent);
    });

    const analizarLote = async () => {
      errorMsg.value = null;
      resultadoData.value = null;

      if (!productor.value.trim()) {
        errorMsg.value = "Complete el nombre del productor.";
        return;
      }
      if (!email.value.trim()) {
        errorMsg.value = "Ingrese un correo electrónico.";
        return;
      }
      if (!campaña.value.trim()) {
        errorMsg.value = "Indique la campaña.";
        return;
      }
      if (!coordenadasRaw.value.trim()) {
        errorMsg.value = "Ingrese coordenadas del polígono.";
        return;
      }

      cargando.value = true;

      // Simular un pequeño retardo para dar sensación de procesamiento
      setTimeout(() => {
        try {
          const puntos = parsearCoordenadas(coordenadasRaw.value);
          const areaHa = calcularAreaHectareas(puntos);
          if (areaHa <= 0.0001) throw new Error("Área nula o demasiado pequeña.");
          const verde = generarResultadoVerde(areaHa);
          resultadoData.value = {
            veredicto: verde.veredicto,
            areaHa: verde.areaHa,
            co2Ton: verde.co2Ton,
            indiceVerde: verde.indiceVerde,
            puntosIngresados: puntos.length,
            rawCoords: coordenadasRaw.value,
            productor: productor.value.trim(),
            email: email.value.trim(),
            campaña: campaña.value.trim()
          };
        } catch (err) {
          errorMsg.value = `✗ Error: ${err.message}`;
        } finally {
          cargando.value = false;
        }
      }, 600);
    };

    const descargarInforme = () => {
      if (!resultadoData.value) return;
      const d = resultadoData.value;
      const fecha = new Date().toISOString().slice(0,19).replace(/:/g, '-');
      const contenido = `INFORME CO₂ TRAZABILIDAD · DESARROLLO VERDE
=========================================
Productor: ${d.productor}
Email: ${d.email}
Campaña: ${d.campaña}
Fecha del informe: ${new Date().toLocaleString()}

Superficie analizada: ${d.areaHa} ha
Carbono almacenado: ${d.co2Ton} tCO₂e
Índice de desarrollo verde: ${d.indiceVerde}
Veredicto: ${d.veredicto}
Puntos del polígono: ${d.puntosIngresados}

---
Certificado de trazabilidad de carbono. Proyecto alineado a desarrollo sostenible.
Este documento es generado automáticamente por el verificador CO₂ trazabilidad.`;
      const blob = new Blob([contenido], {type: "text/plain"});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `informe_co2_${d.productor.replace(/\s/g,'_')}_${fecha}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const crearRipple = (event) => addRippleEffect(event);

    return {
      coordenadasRaw,
      productor,
      email,
      campaña,
      cargando,
      errorMsg,
      resultadoData,
      anioActual,
      carbonPercent,
      analizarLote,
      descargarInforme,
      crearRipple
    };
  }
}).mount('#app');
