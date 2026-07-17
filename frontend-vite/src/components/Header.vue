<template>
  <header class="header" role="banner">
    <div class="header__container">
      <!-- Logo a la izquierda -->
      <router-link to="/" class="header__logo" aria-label="TerraSentry - Inicio">
        <span class="logo-icon">
          <span class="co2-badge">CO₂</span>
        </span>
        <span class="logo-text">TERRASENTRY</span>
      </router-link>

      <!-- Navegación escritorio -->
      <nav class="header__nav header__nav--desktop" role="navigation" aria-label="Navegación principal">
        <ul class="header__nav-list">
          <li><router-link to="/">Inicio</router-link></li>
          <li><router-link to="/analisis">Análisis</router-link></li>
          <li><a href="/guia-de-uso.html">Documentación</a></li>
          <li><a href="/preguntas-frecuentes.html">Contacto</a></li>
          <li><button class="btn btn--tutorial" @click="$emit('start-tutorial')">🎓 Tutorial</button></li>
          <li><button class="btn btn--help" disabled aria-disabled="true">❓ Ayuda</button></li>
        </ul>
      </nav>

      <!-- Botón hamburguesa (móvil) -->
      <button
        class="header__menu-toggle"
        :class="{ 'header__menu-toggle--open': isMenuOpen }"
        @click="toggleMenu"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Abrir menú de navegación"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Menú overlay móvil -->
    <Transition name="menu-fade">
      <div v-if="isMenuOpen" id="mobile-menu" class="header__mobile-overlay" @click.self="closeMenu">
        <nav class="header__mobile-nav" role="navigation" aria-label="Navegación móvil">
          <ul class="header__nav-list--vertical">
            <li><router-link to="/" @click="closeMenu">Inicio</router-link></li>
            <li><router-link to="/analisis" @click="closeMenu">Análisis</router-link></li>
            <li><a href="/guia-de-uso.html" @click="closeMenu">Documentación</a></li>
            <li><a href="/preguntas-frecuentes.html" @click="closeMenu">Contacto</a></li>
            <li><button class="btn btn--tutorial" @click="$emit('start-tutorial'); closeMenu()">🎓 Tutorial</button></li>
            <li><button class="btn btn--help" disabled aria-disabled="true">❓ Ayuda</button></li>
          </ul>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

defineEmits(['start-tutorial'])
</script>

<style scoped>
/* ---------- Variables (puedes heredarlas de :root) ---------- */
.header {
  --header-bg: rgba(15, 23, 42, 0.75);
  --header-border: rgba(255, 255, 255, 0.15);
  --header-blur: 12px;
  --text-primary: #e2e8f0;
  --text-hover: #ffffff;
  --brand-green: #10b981;
  --brand-blue: #2563eb;
  --transition: all 0.3s ease;
}

/* ---------- Estructura base ---------- */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--header-bg);
  backdrop-filter: blur(var(--header-blur));
  -webkit-backdrop-filter: blur(var(--header-blur));
  border-bottom: 1px solid var(--header-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  transition: background 0.3s ease;
}

.header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
}

/* ---------- Logo ---------- */
.header__logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--text-primary);
}

.logo-icon {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.co2-badge {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 900;
  font-size: 1.1rem;
  color: white;
  line-height: 1;
}

.logo-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 900;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ---------- Navegación escritorio ---------- */
.header__nav--desktop {
  display: none; /* oculto por defecto, visible en desktop */
}

.header__nav-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.header__nav-list a,
.header__nav-list .btn {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  transition: var(--transition);
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.header__nav-list a:hover,
.header__nav-list .btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-hover);
}

.btn--tutorial {
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid var(--brand-blue);
  color: var(--brand-blue);
}

.btn--help {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- Botón hamburguesa ---------- */
.header__menu-toggle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.header__menu-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: var(--transition);
  transform-origin: center;
}

/* Animación a X */
.header__menu-toggle--open span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}
.header__menu-toggle--open span:nth-child(2) {
  opacity: 0;
}
.header__menu-toggle--open span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* ---------- Overlay móvil ---------- */
.header__mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header__mobile-nav {
  width: 100%;
  max-width: 320px;
  padding: 2rem;
}

.header__nav-list--vertical {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
}

.header__nav-list--vertical a,
.header__nav-list--vertical .btn {
  display: block;
  width: 100%;
  padding: 0.9rem 1.2rem;
  font-size: 1rem;
  text-align: center;
  border-radius: 10px;
  color: var(--text-primary);
  text-decoration: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: var(--transition);
  font-family: inherit;
  font-weight: 500;
}

.header__nav-list--vertical a:hover,
.header__nav-list--vertical .btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Transición del overlay */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.3s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

/* ---------- Responsive ---------- */
@media (min-width: 768px) {
  .header__nav--desktop {
    display: block;
  }

  .header__menu-toggle {
    display: none;
  }
}

@media (max-width: 767px) {
  .header__nav--desktop {
    display: none;
  }
}
</style>
