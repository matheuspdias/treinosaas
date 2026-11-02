import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from '@/stores/toastStore'

const UPDATE_CHECK_MS = 60 * 60 * 1000

/** Avisa quando há uma nova versão do app e quando ele ficou pronto para uso offline. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('Nova versão disponível.', {
      duration: 0,
      action: { label: 'Atualizar', onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    if (!offlineReady) return
    toast('Pronto para usar offline.', { tone: 'success' })
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  return null
}
