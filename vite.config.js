import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para que funcione en GitHub Pages (melquiadesiguini.github.io/cronometro-rcp/)
export default defineConfig({
  plugins: [react()],
  base: './',
});
