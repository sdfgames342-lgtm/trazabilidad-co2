import { fetchWithAuth, getApiKey } from './utils/auth.js'

// Función hash existente
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class ApiClient {
  static async analyze(payload) {
    const salt = 'TerraSentry-Compliance-2026';
    const complianceToken = await sha256((payload.renspa || '') + (payload.cuit || '') + salt);
    const sanitizedPayload = {
      coords: payload.coords,
      compliance_token: complianceToken,
      campaña: payload.campaña,
      producto: payload.producto
    };

    const resp = await fetchWithAuth('/analyze', {
      method: 'POST',
      body: JSON.stringify(sanitizedPayload)
    });

    if (!resp.ok) {
      const data = await resp.json();
      throw new Error(data.error || 'Error del servidor');
    }
    return await resp.json();
  }

  static async getEmergencyLayers() {
    const resp = await fetchWithAuth('/api/emergency-layers');
    if (!resp.ok) throw new Error('Error cargando capas');
    return await resp.json();
  }

  static async reporteIA(payload) {
    const resp = await fetchWithAuth('/reporte-ia', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Error al generar reporte IA');
    return await resp.json();
  }
}
