import { useEffect, useState } from 'react'
import { formatClock } from '@/domain/duration'

/** Relógio que atualiza a cada segundo desde `startedAt`. */
export function useElapsed(startedAt: string | undefined): string {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [startedAt])
  if (!startedAt) return '0:00'
  return formatClock((now - new Date(startedAt).getTime()) / 1000)
}
