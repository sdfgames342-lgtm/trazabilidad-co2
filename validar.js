function validarCoordenadas(texto) {
  if (typeof texto !== 'string') return null;
  let limpio = texto.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  limpio = limpio.normalize('NFD').replace(/[\u0300-\u036f]{4,}/g, '');
  if (/\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|SCRIPT)\b/i.test(limpio)) return null;
  if (/<[^>]+>/.test(limpio) || /<\/[^>]+>/.test(limpio)) return null;
  if (limpio.length > 500) return null;
  if (limpio.trim().length === 0) return null;
  return limpio.trim();
}
