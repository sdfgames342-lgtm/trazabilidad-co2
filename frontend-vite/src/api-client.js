async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export class ApiClient {
  static async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async analyze(payload) {
    const salt = "TerraSentry-Compliance-2026";
    const complianceToken = await sha256((payload.renspa || "") + (payload.cuit || "") + salt);
    const sanitizedPayload = {
      coords: payload.coords,
      compliance_token: complianceToken,
      campana: payload.campaña,
      producto: payload.producto
    };
    const headers = { "Content-Type": "application/json" };
    if (localStorage.getItem("api_key")) {
      headers["X-API-Key"] = localStorage.getItem("api_key");
    }
    const resp = await fetch("/analyze", {
      method: "POST",
      headers,
      body: JSON.stringify(sanitizedPayload)
    });
    if (!resp.ok) {
      const data = await resp.json();
      throw new Error(data.error || "Error del servidor");
    }
    return await resp.json();
  }
}
