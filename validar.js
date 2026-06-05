/**
 * Valida y sanitiza la entrada de coordenadas.
 * Retorna la cadena limpia o null si es inválida.
 */
function validarCoordenadas(texto) {
  if (typeof texto !== 'string') return null;
  
  // Eliminar caracteres nulos y de control (excepto espacio y salto de línea)
  let limpio = texto.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Eliminar texto Zalgo y caracteres diacríticos combinados excesivos
  // Elimina marcas de combinación Unicode que se repiten
  limpio = limpio.normalize('NFD').replace(/[\u0300-\u036f]{4,}/g, '');
  
  // Rechazar patrones SQL comunes (palabras clave seguidas de espacio o inicio/fin)
  const patronesSQL = /\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|SCRIPT)\b/i;
  if (patronesSQL.test(limpio)) return null;
  
  // Rechazar presencia de etiquetas HTML/script
  if (/<[^>]+>/.test(limpio) || /<\/[^>]+>/.test(limpio)) return null;
  
  // Limitar longitud máxima
  if (limpio.length > 500) return null;
  
  // Si después de limpiar queda vacío, inválido
  if (limpio.trim().length === 0) return null;
  
  return limpio.trim();
}
