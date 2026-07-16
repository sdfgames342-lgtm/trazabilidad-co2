<template>
  <header class="header" role="banner">
    <div class="header__container">
      <router-link to="/" class="header__logo" aria-label="TerraSentry - Inicio">
        <span class="logo-icon" aria-hidden="true">🌍</span>
        <span class="logo-text">
          <span class="co2-badge">CO₂</span> TerraSentry
        </span>
      </router-link>

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
          <li><a href="/docs" @click="closeMenu">Documentación</a></li>
          <li><a href="/contacto" @click="closeMenu">Contacto</a></li>
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
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  transition: background var(--transition-fast);
}

.header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
  flex-wrap: wrap;
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--brand-white);
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.co2-badge {
  background: rgba(16, 185, 129, 0.15);
  color: var(--brand-green);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--brand-green);
  font-size: 0.75rem;
}

.header__nav-list {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: center;
}

.header__nav-list a,
.header__nav-list .btn {
  color: var(--brand-gray-200);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.header__nav-list a:hover,
.header__nav-list .btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--brand-white);
}

.btn--tutorial {
  background: rgba(37, 99, 235, 0.2) !important;
  border: 1px solid var(--brand-blue) !important;
  color: var(--brand-blue) !important;
}

.btn--help:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header__menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger-line {
  width: 22px;
  height: 2px;
  background: var(--brand-white);
  transition: all var(--transition-fast);
}

@media (max-width: 768px) {
  .header__menu-toggle {
    display: flex;
  }

  .header__nav {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .header__nav--open {
    max-height: 400px;
  }

  .header__nav-list {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 0;
    gap: 0.75rem;
  }

  .header__nav-list a,
  .header__nav-list .btn {
    width: 100%;
    text-align: left;
  }
}
</style>
