import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' para que funcione en GitHub Pages (melquiadesiguini.github.io/cronometro-rcp/)
export default defineConfig({
  plugins: [
    react(),
    // App instalable y sin internet: la primera vez que se abre con conexión, el
    // teléfono guarda todos los archivos y después funciona sin señal.
    VitePWA({
      // 'prompt': la app decide cuándo actualizar (nunca en medio de una RCP; ver src/lib/updates.js).
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Cronómetro RCP',
        short_name: 'RCP',
        description: 'Cronómetro de apoyo para reanimación cardiopulmonar.',
        lang: 'es-AR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#111111',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // Las tipografías vienen de Google Fonts: se guardan la primera vez que se usan.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  // Tres páginas: la app y las dos legales (comparten estilos y paletas).
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terminos: resolve(__dirname, 'terminos.html'),
        privacidad: resolve(__dirname, 'privacidad.html'),
      },
    },
  },
});
