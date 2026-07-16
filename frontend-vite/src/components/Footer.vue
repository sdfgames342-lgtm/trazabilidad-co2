<template>
  <footer class="footer" role="contentinfo">
    <div class="footer__grid">
      <div class="footer__column">
        <h4 class="footer__heading">Sobre TerraSentry</h4>
        <p class="footer__text">
          Plataforma de trazabilidad ambiental para el cumplimiento de la EUDR. Monitoreo satelital, análisis de deforestación y emisión de certificados verificables.
        </p>
        <div class="footer__socials">
          <a href="#" aria-label="Twitter"><svg width="20" height="20" fill="currentColor"><path d="..."/></svg></a>
          <a href="#" aria-label="LinkedIn"><svg width="20" height="20" fill="currentColor"><path d="..."/></svg></a>
          <a href="#" aria-label="GitHub"><svg width="20" height="20" fill="currentColor"><path d="..."/></svg></a>
        </div>
      </div>

      <div class="footer__column">
        <h4 class="footer__heading">Recursos para Productores</h4>
        <ul class="footer__links">
          <li><a href="#">Guía de Uso</a></li>
          <li><a href="#">Preguntas Frecuentes</a></li>
          <li><a href="#">API para Desarrolladores</a></li>
          <li><a href="#">Política de Privacidad</a></li>
        </ul>
      </div>

      <div class="footer__column">
        <h4 class="footer__heading">Contacto Legal / Soporte</h4>
        <address class="footer__address">
          <p>📧 <a href="mailto:soporte@terrasentry.com">soporte@terrasentry.com</a></p>
          <p>📞 +54 9 358 123-4567</p>
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
.footer {
  background: var(--brand-gray-900);
  color: var(--brand-gray-200);
  padding: 3rem 1.25rem 1.5rem;
  margin-top: auto;
  border-top: 1px solid var(--glass-border);
}

.footer__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.footer__heading {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand-green);
  margin-bottom: 1rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.footer__heading::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 30px;
  height: 2px;
  background: var(--brand-green);
}

.footer__text {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--brand-gray-400);
  margin-bottom: 1rem;
}

.footer__socials {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.footer__socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  transition: background var(--transition-fast);
}

.footer__socials a:hover {
  background: var(--brand-blue);
}

.footer__links {
  list-style: none;
  padding: 0;
}

.footer__links li {
  margin-bottom: 0.5rem;
}

.footer__links a {
  color: var(--brand-gray-400);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color var(--transition-fast);
}

.footer__links a:hover {
  color: var(--brand-white);
}

.footer__address {
  font-style: normal;
  font-size: 0.85rem;
  color: var(--brand-gray-400);
  line-height: 1.8;
}

.footer__address a {
  color: var(--brand-gray-400);
  text-decoration: none;
}

.footer__disclaimer {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem 1.25rem;
  background: rgba(255,255,255,0.05);
  border-left: 4px solid var(--brand-amber, #f59e0b);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--brand-gray-400);
}

.footer__bottom {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1.5rem;
  gap: 1rem;
}

.footer__partners {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.partner-label {
  font-size: 0.75rem;
  color: var(--brand-gray-600);
}

.partner-logo {
  opacity: 0.8;
  transition: opacity var(--transition-fast);
}

.partner-logo:hover {
  opacity: 1;
}

.footer__copy {
  font-size: 0.75rem;
  color: var(--brand-gray-600);
}
</style>
