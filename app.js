const { createApp } = Vue;

createApp({
  data() {
    return {
      coords: '',
      cargando: false,
      error: null,
      resultado: null,
      // ⚠️ REEMPLAZÁ con tu URL de Cloudflare (sin barra final)
      apiUrl: 'https://sentence-miller-mother-industrial.trycloudflare.com '
    };
  },
  methods: {
    async analizar() {
      this.error = null;
      this.resultado = null;

      // Validación de datos
      const sanitizado = validarCoordenadas(this.coords);
      if (!sanitizado) {
        this.error = 'Coordenadas inválidas. Usá el formato "lat,lon; lat,lon" (sin caracteres especiales).';
        return;
      }

      this.cargando = true;

      try {
        const response = await fetch(this.apiUrl + '/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coords: sanitizado })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Error del servidor');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        this.resultado = {
          veredicto: '✅ Informe generado correctamente.',
          deforestacion: 'Ver PDF',
          pdf_url: url
        };
      } catch (e) {
        this.error = e.message;
      } finally {
        this.cargando = false;
      }
    }
  }
}).mount('#app');
