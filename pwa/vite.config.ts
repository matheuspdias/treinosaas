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
      manifest: {
        id: '/',
        name: 'TreinoApp: registro de treinos',
        short_name: 'Treino',
        description:
          'Registre séries e cargas da musculação em segundos, com fichas, descanso automático, progressão e recordes. Funciona offline.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        categories: ['health', 'fitness', 'sports', 'lifestyle'],
        prefer_related_applications: false,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          {
            name: 'Próximo treino',
            short_name: 'Treinar',
            description: 'Abre a tela inicial com o próximo treino da sequência',
            url: '/?origem=atalho',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Progresso',
            url: '/progresso',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Exercícios',
            url: '/exercicios',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        screenshots: [
          {
            src: 'screenshots/inicio.webp',
            sizes: '1170x2532',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Próximo treino da sequência',
          },
          {
            src: 'screenshots/treino.webp',
            sizes: '1170x2532',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Modo treino com sugestão de carga',
          },
          {
            src: 'screenshots/progresso.webp',
            sizes: '1170x2532',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Calendário e sequência de semanas',
          },
          {
            src: 'screenshots/historico.webp',
            sizes: '1170x2532',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Evolução de carga por exercício',
          },
          {
            src: 'screenshots/wide.webp',
            sizes: '1920x1080',
            type: 'image/webp',
            form_factor: 'wide',
            label: 'Progresso no computador',
          },
        ],
      },
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
