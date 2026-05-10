import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5180, // Evitar conflictos con el Service Worker de Águilas de Chiriquí PWA
    strictPort: true
  }
});
