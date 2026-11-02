import { useEffect, useRef } from 'react'
import { setRest } from '@/domain/session'
import type { Session, Settings } from '@/domain/types'
import { showNotification } from '@/lib/notifications'
import { playRestEndSound } from '@/lib/sound'
import { REST_END_VIBRATION, vibrate } from '@/lib/vibrate'

/** Se o app voltar mais de 10 s depois do fim do descanso, não apita (já passou). */
const LATE_TOLERANCE_MS = 10_000

/**
 * Dispara os alertas de fim de descanso (vibração, som, notificação em segundo plano)
 * e limpa o descanso da sessão. Baseado no horário absoluto `rest.endsAt`.
 */
export function useRestAlerts(
  session: Session | null,
  settings: Settings,
  apply: (fn: (s: Session) => Session) => void,
): void {
  const fired = useRef<string | null>(null)
  const endsAt = session?.rest?.endsAt
  const nextName = session?.exercises[session.currentExerciseIndex]?.exerciseName

  useEffect(() => {
    if (!endsAt) return
    const fire = () => {
      if (fired.current === endsAt) return
      fired.current = endsAt
      const late = Date.now() - Date.parse(endsAt) > LATE_TOLERANCE_MS
      if (!late) {
        if (settings.restVibration) vibrate(REST_END_VIBRATION)
        if (settings.restSound) playRestEndSound()
        if (settings.restNotification && document.visibilityState === 'hidden') {
          void showNotification('Descanso terminou', {
            body: nextName ? `Bora para a próxima série: ${nextName}` : 'Bora para a próxima série',
            tag: 'rest-timer',
          })
        }
      }
      apply((s) => (s.rest?.endsAt === endsAt ? setRest(s, null) : s))
    }

    const ms = Date.parse(endsAt) - Date.now()
    if (ms <= 0) {
      fire()
      return
    }
    const timer = setTimeout(fire, ms)
    // Ao voltar do segundo plano o timer pode ter atrasado: confere na hora.
    const onVisible = () =>
      document.visibilityState === 'visible' && Date.parse(endsAt) <= Date.now() && fire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [
    endsAt,
    nextName,
    settings.restVibration,
    settings.restSound,
    settings.restNotification,
    apply,
  ])
}
