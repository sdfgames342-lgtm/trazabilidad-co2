const API_KEY_STORAGE_KEY = 'terrasentry_api_key'

/**
 * Obtiene la API Key almacenada o una por defecto (para desarrollo).
 * En producción, la clave se configura en Vercel y se pasa al frontend.
 */
export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || ''
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

/**
 * Realiza una petición fetch con la API Key en X-API-Key.
 * Si recibe 401, limpia la clave y lanza un error descriptivo.
 * Opcional: redirigir a una pantalla de login.
 */
export async function fetchWithAuth(url, options = {}) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    console.warn('[TerraSentry] No hay API Key configurada. La petición fallará.')
    // Podrías redirigir a una página de configuración o mostrar un modal.
    throw new Error('API Key no configurada')
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...options.headers
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    console.error('[TerraSentry] Error 401: API Key inválida o expirada.')
    clearApiKey()
    // Opcional: redirigir al login
    // window.location.href = '/login'
    throw new Error('No autorizado. Verifica tu API Key.')
  }

  return response
}
