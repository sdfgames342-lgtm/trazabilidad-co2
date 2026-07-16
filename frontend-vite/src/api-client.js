export class ApiClient {
  static async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async analyze(payload) {
    const salt = 'TerraSentry-Compliance-2026';
    const complianceToken = await this.sha256((payload.renspa || '') + (payload.cuit || '') + salt);

    const sanitizedPayload = {
      coords: payload.coords,
      compliance_token: complianceToken,
      campaña: payload.campaña,
      producto: payload.producto
    };

    const resp = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedPayload)
    });
    if (!resp.ok) throw new Error('Error en el análisis');
    return await resp.json();
  }
}
