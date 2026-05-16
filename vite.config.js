import { defineConfig } from 'vite';

export default defineConfig({
  base: '/LA-ILIDADA/', // Necesario para GitHub Pages
  server: {
    port: 5183,
    strictPort: true,
  },
});
