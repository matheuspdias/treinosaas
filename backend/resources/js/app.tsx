import '../css/app.css'

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { listenForInstall, registerServiceWorker } from './lib/install'
import { initTheme } from './ui/theme/theme'

// Antes do React: o convite de instalação do navegador chega cedo e uma vez só.
listenForInstall()
registerServiceWorker()

createInertiaApp({
  title: (title) => (title ? `${title} · Painel da academia` : 'Painel da academia'),
  resolve: (name) =>
    resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
  progress: { color: 'var(--c-accent)', delay: 150 },
})

initTheme()
