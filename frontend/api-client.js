class ApiClient {
  static async analyze(payload) {
    const resp = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const data = await resp.json();
      throw new Error(data.error || 'Error del servidor');
    }
    return await resp.json();
  }

  static async getEmergencyLayers() {
    const resp = await fetch('/api/emergency-layers');
    if (!resp.ok) throw new Error('Error cargando capas');
    return await resp.json();
  }

  static async reporteIA(payload) {
    const resp = await fetch('/reporte-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Error al generar reporte IA');
    return await resp.json();
  }
}
