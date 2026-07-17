<template>
  <footer class="footer" role="contentinfo">
    <div class="footer__grid">
      <div class="footer__column">
        <h4 class="footer__heading">Sobre TerraSentry</h4>
        <p class="footer__text">
          Plataforma de trazabilidad ambiental para el cumplimiento de la EUDR. Monitoreo satelital, análisis de deforestación y emisión de certificados verificables.
        </p>
        <div class="footer__socials">
          <a href="#" aria-label="Twitter" title="Twitter"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17a4.77 4.77 0 00-8.13 4.35C7.68 9.5 4.07 7.36 1.64 4.16a4.77 4.77 0 001.48 6.37c-.77-.03-1.5-.24-2.13-.6v.06a4.77 4.77 0 003.83 4.67c-.7.19-1.44.22-2.16.08a4.78 4.78 0 004.46 3.31A9.56 9.56 0 010 19.54a13.5 13.5 0 007.33 2.15c8.8 0 13.6-7.3 13.6-13.63 0-.21 0-.42-.02-.63A9.7 9.7 0 0024 4.56a9.5 9.5 0 01-2.54.7z"/></svg></a>
          <a href="#" aria-label="LinkedIn" title="LinkedIn"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.42v1.56h.05a3.75 3.75 0 013.37-1.85c3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.07 20.45H3.6V9h3.47v11.45z"/></svg></a>
          <a href="#" aria-label="GitHub" title="GitHub"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg></a>
        </div>
      </div>
      <div class="footer__column">
        <h4 class="footer__heading">Recursos para Productores</h4>
        <ul class="footer__links">
          <li><a href="/guia-de-uso.html">Guía de Uso</a></li>
          <li><a href="/preguntas-frecuentes.html">Preguntas Frecuentes</a></li>
          <li><a href="/api-para-desarrolladores.html">API para Desarrolladores</a></li>
          <li><a href="/politica-de-privacidad.html">Política de Privacidad</a></li>
        </ul>
      </div>
      <div class="footer__column">
        <h4 class="footer__heading">Contacto Legal / Soporte</h4>
        <address class="footer__address">
          <p>📧 <a href="mailto:andalucia.terrabyte@gmail.com">andalucia.terrabyte@gmail.com</a></p>
          <p>📍 Córdoba, Argentina</p>
        </address>
        <p class="footer__legal-link"><a href="#">Términos y Condiciones</a></p>
      </div>
    </div>

    <div class="footer__disclaimer">
      <p>
        <strong>Descargo de responsabilidad:</strong> TerraSentry proporciona un análisis preliminar basado en datos satelitales públicos. Este informe no constituye una certificación oficial EUDR. Los productores deben verificar los resultados con un auditor autorizado.
      </p>
    </div>

    <div class="footer__bottom">
      <div class="footer__partners">
        <span class="partner-label">Con el apoyo de:</span>
        <a href="https://andalucia-projcts-foundation-cba-ar.vercel.app/" target="_blank" rel="noopener">
          <img
            src="/logo-andalucia.png"
            alt="Fundación Andalucía"
            class="partner-logo"
            width="120"
          />
        </a>
      </div>
      <p class="footer__copy">© {{ new Date().getFullYear() }} TerraSentry. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
/* ... (mantén todo el CSS anterior del Footer) ... */
</style>
