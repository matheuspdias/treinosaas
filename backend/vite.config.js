import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    laravel({ input: ['resources/js/app.tsx'], refresh: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'resources/js') } },
  // Dentro do Docker: HMR acessível pelo navegador do host.
  server: { host: '0.0.0.0', port: 5173, strictPort: true, hmr: { host: 'localhost' } },
})
