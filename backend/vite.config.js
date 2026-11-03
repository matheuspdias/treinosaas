import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    laravel({
      // A landing tem CSS e JS próprios (sem React): fica leve para quem chega pelo WhatsApp.
      input: ['resources/js/app.tsx', 'resources/css/landing.css', 'resources/js/landing.js'],
      refresh: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'resources/js') } },
  // Dentro do Docker: HMR acessível pelo navegador do host.
  server: { host: '0.0.0.0', port: 5173, strictPort: true, hmr: { host: 'localhost' } },
})
