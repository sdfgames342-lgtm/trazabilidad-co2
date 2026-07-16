import L from 'leaflet'
import 'leaflet-draw'
import { ApiClient } from './api-client.js'

export default class MapManager {
  constructor(containerId) {
    this.containerId = containerId
    this.map = null
    this.polygonLayer = null
    this.emergencyLayerGroup = null
    this.drawnItems = null
  }

  initialize(coordsRawRef) {
    // mismo código de frontend/map-manager.js, pero usando 'this.map = L.map(...)'
    // y 'import L from 'leaflet'' ya está disponible
    if (this.map) return
    this.map = L.map(this.containerId).setView([-33.12, -64.35], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(this.map)
    L.tileLayer.wms("https://geoservicios.conae.gov.ar/geoserver/ows", { layers: "focos_calor", format: "image/png", transparent: true, attribution: "CONAE", opacity: 0.7 }).addTo(this.map)

    this.emergencyLayerGroup = L.layerGroup().addTo(this.map)
    this.drawnItems = new L.FeatureGroup()
    this.map.addLayer(this.drawnItems)

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: { polygon: { allowIntersection: false, drawError: { color: '#ef4444', message: '<strong>¡No cruces las líneas!</strong>' }, shapeOptions: { color: '#10b981' } }, polyline: false, circle: false, rectangle: false, marker: false, circlemarker: false },
      edit: { featureGroup: this.drawnItems, remove: true }
    })
    this.map.addControl(drawControl)

    this.map.on(L.Draw.Event.CREATED, (e) => {
      this.drawnItems.clearLayers()
      this.drawnItems.addLayer(e.layer)
      const coordStr = e.layer.getLatLngs()[0].map(ll => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join('; ')
      if (coordsRawRef) coordsRawRef.value = coordStr
    })

    this.loadEmergencyLayers()
  }

  async loadEmergencyLayers() {
    // igual que antes, pero usando ApiClient
    try {
      const datos = await ApiClient.getEmergencyLayers()
      this.emergencyLayerGroup.clearLayers()
      datos.forEach(item => {
        if (!item.lat || !item.lng) return
        const color = {instalacion_peligrosa:'orange',contaminacion:'purple',incendio:'red',sismo:'brown'}[item.category] || 'gray'
        L.circleMarker([item.lat, item.lng], {radius:6, color, fillColor:color, fillOpacity:0.6})
          .addTo(this.emergencyLayerGroup).bindPopup(`${item.type||item.category}<br>${item.valor||''} ${item.unidad||''}`)
      })
    } catch(e) { console.warn('Emergency layers:', e) }
    // SMN
    fetch('https://alertas-smn.api.gob.ar/v1/alertas/geojson')
      .then(r => r.json())
      .then(data => {
        L.geoJSON(data, {style: f => ({color: f.properties.nivel==='rojo'?'#dc2626':f.properties.nivel==='naranja'?'#f97316':'#facc15', weight:2, fillOpacity:0.2})})
          .addTo(this.emergencyLayerGroup)
      }).catch(e => console.warn('SMN alertas:', e))
  }

  drawPolygon(coordenadasTexto, colorAlerta = '#2a7f6e') {
    if (this.polygonLayer) this.map.removeLayer(this.polygonLayer)
    const puntos = coordenadasTexto.split(';').map(p => p.trim().split(',').map(Number))
    if (puntos.length >= 3) {
      this.polygonLayer = L.polygon(puntos, {color:colorAlerta, weight:4, fillColor:colorAlerta, fillOpacity:0.35}).addTo(this.map)
      this.map.fitBounds(this.polygonLayer.getBounds())
    }
  }

  setView(lat, lon, zoom = 13) {
    if (this.map) this.map.setView([lat, lon], zoom)
  }
}
