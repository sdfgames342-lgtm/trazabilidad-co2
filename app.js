const { createApp } = Vue;

createApp({
  data() {
    return {
      coords: '',
      cargando: false,
      error: null,
      resultado: null,
      // ⚠️ REEMPLAZÁ ESTA URL con la de tu túnel de Cloudflare (sin barra final)
      apiUrl: 'https://provided-classified-rug-except.trycloudflare.com'
    };
  },
  methods: {
    async analizar() {
      this.error = null;
      this.resultado = null;

      if (!this.coords.trim()) {
        this.error = 'Por favor ingresá las coordenadas.';
        return;
      }

      this.cargando = true;

      try {
        const response = await fetch(this.apiUrl + '/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coords: this.coords.trim() })
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
