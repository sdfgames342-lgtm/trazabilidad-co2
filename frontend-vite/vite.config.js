import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // VitePWA({ ... })  // Desactivado temporalmente por memoria
  ],
  base: '/',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
