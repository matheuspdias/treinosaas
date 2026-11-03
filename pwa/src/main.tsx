import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { linkAcademyManifest } from '@/app/brandHead'
import { listenForInstall } from '@/lib/install'
import './index.css'

linkAcademyManifest()
listenForInstall()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
