import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // ── Set base to repo name for GitHub Pages ──────────────────
  // Change '/lifehub/' to match your GitHub repo name exactly.
  // Example: if your repo is github.com/piyap/lifehub → base: '/lifehub/'
  base: '/lifehub/',

  build: {
    outDir: 'dist',
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Use external manifest.webmanifest in /public
      manifest: false,

      includeAssets: [
        'icons/*.png',
        'icons/*.svg',
        'manifest.webmanifest',
      ],

      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],

        // Navigate fallback for SPA (GitHub Pages needs this)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],

        // Skip waiting + claim — ensures latest SW activates immediately
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // Google Fonts CSS
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
