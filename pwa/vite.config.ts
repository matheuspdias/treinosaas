/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import pkg from './package.json' with { type: 'json' }
import { VitePWA } from 'vite-plugin-pwa'

/**
 * og:image precisa de URL absoluta para a prévia de link no WhatsApp/redes.
 * Usa SITE_URL ou o domínio de produção que a Vercel expõe no build.
 */
function absoluteOgImage(): Plugin {
  const host = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
  const origin = host ? (host.startsWith('http') ? host : `https://${host}`).replace(/\/$/, '') : ''
  return {
    name: 'absolute-og-image',
    transformIndexHtml: (html) =>
      origin ? html.replace('content="/og-image.png"', `content="${origin}/og-image.png"`) : html,
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    absoluteOgImage(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      // Sem manifest fixo: cada academia tem o seu, gerado pela API com nome, cor e ícone
      // (link inserido em src/app/brandHead.ts).
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // As imagens do catálogo são ~18 MB: ficam fora do precache e entram em cache sob demanda.
        globIgnores: ['exercises/**', 'splash/**', 'screenshots/**', 'og-image.png', 'logo.svg'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/exercises/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-images',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // O catálogo de exercícios (~820 kB, 150 kB gzip) é um chunk próprio carregado sob demanda.
    chunkSizeWarningLimit: 900,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
