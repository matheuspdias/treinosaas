import { useEffect } from 'react'

/**
 * Mantém a tela acesa enquanto `active` for true.
 * O navegador solta o wake lock quando a aba fica oculta; ele é pedido de novo ao voltar.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let disposed = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return
      try {
        const s = await navigator.wakeLock.request('screen')
        if (disposed) void s.release()
        else sentinel = s
      } catch {
        // Bateria fraca ou permissão negada: segue sem wake lock.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', request)
      void sentinel?.release()
    }
  }, [active])
}
