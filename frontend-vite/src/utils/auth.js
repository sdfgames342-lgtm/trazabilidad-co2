export function getApiKey() {
  return localStorage.getItem('terrasentry_api_key') || import.meta.env.VITE_API_KEY || ''
}

export async function fetchWithAuth(url, options = {}) {
  const apiKey = getApiKey()
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...options.headers
  }
  return await fetch(url, { ...options, headers })
}
