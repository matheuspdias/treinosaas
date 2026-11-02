import '../css/app.css'

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { initTheme } from './ui/theme/theme'

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
