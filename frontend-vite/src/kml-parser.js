export default class KmlParser {
  static _escapeXml(unsafe) {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  static parse(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const placemarks = xml.querySelectorAll('Placemark');
    for (let pm of placemarks) {
      const coords = pm.querySelector('Polygon coordinates');
      if (coords) {
        const puntos = coords.textContent.trim().split(/\s+/).filter(s => s.length);
        if (puntos.length < 3) continue;
        const resultado = puntos.map(p => {
          const [lon, lat] = p.split(',').map(Number);
          return `${lat},${lon}`;
        });
        if (resultado.length > 1 && resultado[0] === resultado[resultado.length-1]) resultado.pop();
        if (resultado.length >= 3) return resultado.join('; ');
      }
    }
    throw new Error('No se encontró un polígono válido en el KML');
  }

  static generate(coordenadasTexto, nombre, datosAdicionales = null) {
    const pares = coordenadasTexto.split(';').map(p => p.trim().split(',').map(Number));
    const puntos = pares.map(([lat, lon]) => [lon, lat]);
    if (puntos.length && (puntos[0][0] !== puntos[puntos.length-1][0] || puntos[0][1] !== puntos[puntos.length-1][1])) puntos.push([...puntos[0]]);
    const coordsStr = puntos.map(p => p.join(',')+',0').join(' ');

    let descripcion = 'Polígono generado desde TerraSentry';
    if (datosAdicionales) {
      // Escapar valores para el XML
      const area = this._escapeXml(datosAdicionales.areaTotal);
      const defor = this._escapeXml(datosAdicionales.deforestacion);
      const carbono = this._escapeXml(datosAdicionales.carbono);
      const indice = this._escapeXml(datosAdicionales.indiceVerde);
      const veredicto = this._escapeXml(datosAdicionales.veredicto);

      descripcion = `<![CDATA[<div style="font-family:sans-serif"><h3>Resultados EUDR</h3><ul><li>Superficie: ${area} ha</li><li>Deforestación: ${defor} ha</li><li>Carbono: ${carbono} tCO₂e</li><li>Índice: ${indice}</li><li>Veredicto: ${veredicto}</li></ul></div>]]>`;
    }
    const nombreSeguro = this._escapeXml(nombre || 'Lote');

    return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>TerraSentry</name><Placemark><name>${nombreSeguro}</name><description>${descripcion}</description><Polygon><outerBoundaryIs><LinearRing><coordinates>${coordsStr}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`;
  }
}
