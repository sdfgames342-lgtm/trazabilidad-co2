const { createApp } = Vue;

createApp({
  data() {
    return {
      productor: '',
      email: '',
      renspa: '',
      cuit: '',
      campaña: '',
      coords: '',
      cargando: false,
      error: null,
      resultado: null,
      // ⚠️ REEMPLAZÁ con la URL real de Cloudflare (sin barra final)
      apiUrl: 'https://september-pixels-retrieval-brochures.trycloudflare.com'
    };
  },
  methods: {
    async analizar() {
      this.error = null;
      this.resultado = null;

      const sanitizado = validarCoordenadas(this.coords);
      if (!sanitizado) {
        this.error = 'Coordenadas inválidas. Usá el formato "lat,lon; lat,lon" (sin caracteres especiales).';
        return;
      }

      if (!this.productor.trim() || !this.email.trim() || !this.renspa.trim() || !this.cuit.trim() || !this.campaña.trim()) {
        this.error = 'Completá todos los campos obligatorios.';
        return;
      }

      this.cargando = true;

      try {
        const response = await fetch(this.apiUrl + '/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coords: sanitizado,
            productor: this.productor.trim(),
            email: this.email.trim(),
            renspa: this.renspa.trim(),
            cuit: this.cuit.trim(),
            campaña: this.campaña.trim()
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Error del servidor');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        this.resultado = {
          veredicto: '✅ Informe generado correctamente.',
          deforestacion: 'Archivo ZIP con PDF, CSV y JSON',
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
