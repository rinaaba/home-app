import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// On GitHub Pages the site lives at /<repo-name>/. The deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  // Shown at the bottom of Settings, so you can tell which version you have.
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered in src/core/updates.ts, which also checks for new versions
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Home',
        short_name: 'Home',
        description: 'Our family home app',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f0f4f7',
        theme_color: '#f0f4f7',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/__/],
        // The HEIC converter is big: download it only when someone adds an iPhone HEIC photo.
        globIgnores: ['**/heic-to-*.js'],
        runtimeCaching: [
          {
            // Fonts, so the app looks right offline too.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: /\/assets\/heic-to-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'heic-converter', expiration: { maxEntries: 2 } },
          },
          {
            // Item photos: keep a local copy so the gallery is fast and works offline.
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'item-photos',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
