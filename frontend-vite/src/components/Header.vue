<template>
  <header class="header" :class="{ 'reduced-motion': !animationsEnabled }" role="banner">
    <div class="header__container">
      <!-- Logo rediseñado -->
      <router-link to="/" class="header__logo" aria-label="TerraSentry - Inicio">
        <div class="logo-icon">
          <span class="co2-badge">CO<sup>2</sup></span>
          <div class="electric-effect"></div>
          <div class="blinking-dot"></div>
        </div>
        <span class="logo-text">TERRASENTRY</span>
      </router-link>

      <!-- Toggle de animaciones (menú de configuración) -->
      <div class="header__controls">
        <button class="anim-toggle" @click="animationsEnabled = !animationsEnabled" :aria-pressed="animationsEnabled">
          {{ animationsEnabled ? '✨' : '🚫' }}
        </button>
      </div>

      <!-- Botón hamburguesa -->
      <button
        class="header__menu-toggle"
        @click="isMenuOpen = !isMenuOpen"
        :aria-expanded="isMenuOpen"
        aria-controls="main-navigation"
        aria-label="Abrir menú de navegación"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Navegación principal -->
      <nav
        id="main-navigation"
        class="header__nav"
        :class="{ 'header__nav--open': isMenuOpen }"
        role="navigation"
        aria-label="Navegación principal"
      >
        <ul class="header__nav-list">
          <li><router-link to="/" @click="closeMenu">Inicio</router-link></li>
          <li><router-link to="/analisis" @click="closeMenu">Análisis</router-link></li>
          <li><a href="/guia-de-uso.html" @click="closeMenu">Documentación</a></li>
          <li><a href="/preguntas-frecuentes.html" @click="closeMenu">Contacto</a></li>
          <li><button class="btn btn--tutorial" @click="onTutorial">🎓 Tutorial</button></li>
          <li><button class="btn btn--help" disabled aria-disabled="true">❓ Ayuda</button></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)
const animationsEnabled = ref(true) // controla el efecto eléctrico y el punto parpadeante

function closeMenu() {
  isMenuOpen.value = false
}

const emit = defineEmits(['start-tutorial'])
function onTutorial() {
  closeMenu()
  emit('start-tutorial')
}
</script>

<style scoped>
/* ... (mantén los estilos base) ... */

/* Logo rediseñado */
.header__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-icon {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.co2-badge {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: white;
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 1.1rem;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  z-index: 1;
  position: relative;
}

.electric-effect {
  position: absolute;
  inset: -4px;
  border-radius: 10px;
  background: linear-gradient(45deg, #60a5fa, #3b82f6, #1d4ed8, #60a5fa);
  background-size: 300% 300%;
  filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.blinking-dot {
  position: absolute;
  bottom: -6px;
  left: -6px;
  width: 12px;
  height: 12px;
  background: #60a5fa;
  border-radius: 50%;
  box-shadow: 0 0 8px #3b82f6;
  animation: blink 1.5s infinite;
  z-index: 2;
}

/* Cuando las animaciones están activadas */
.reduced-motion .electric-effect {
  opacity: 0 !important;
}
.reduced-motion .blinking-dot {
  animation: none;
  opacity: 0.3;
}

/* Efectos cuando están habilitados */
@media (prefers-reduced-motion: no-preference) {
  .header:not(.reduced-motion) .electric-effect {
    opacity: 0.6;
    animation: rotateGradient 3s linear infinite;
  }
}

@keyframes rotateGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.logo-text {
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand-white);
}

/* Botón de toggle de animaciones */
.anim-toggle {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--brand-white);
  font-size: 1rem;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-right: 1rem;
  transition: background var(--transition-fast);
}
.anim-toggle:hover {
  background: rgba(255,255,255,0.1);
}

/* Ajustes responsive */
@media (max-width: 768px) {
  .header__container {
    flex-wrap: nowrap;
  }
}
</style>
