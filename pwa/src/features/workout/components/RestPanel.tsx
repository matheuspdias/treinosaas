import { useEffect, useState } from 'react'
import { formatClock, restRemainingSec } from '@/domain/duration'
import type { RestTimer } from '@/domain/types'

export function RestPanel({
  rest,
  onAdjust,
  onSkip,
}: {
  rest: RestTimer
  onAdjust: (deltaSec: number) => void
  onSkip: () => void
}) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250)
    return () => clearInterval(t)
  }, [])
  const remaining = Math.ceil(restRemainingSec(rest.endsAt, now))
  const progress = rest.durationSec > 0 ? Math.min(1, remaining / rest.durationSec) : 0

  return (
    <section
      aria-label="Descanso"
      className="rest-in overflow-hidden rounded-card bg-fg text-bg shadow-sheet"
    >
      <div className="h-1.5 bg-bg/20">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2 p-2 pl-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-70">Descanso</p>
          <p className="text-4xl leading-none font-extrabold tabular" role="timer" aria-live="off">
            {formatClock(remaining)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          className="min-h-touch min-w-14 rounded-control bg-bg/15 px-2 font-bold active:bg-bg/25"
          aria-label="Menos 15 segundos"
        >
          −15
        </button>
        <button
          type="button"
          onClick={() => onAdjust(15)}
          className="min-h-touch min-w-14 rounded-control bg-bg/15 px-2 font-bold active:bg-bg/25"
          aria-label="Mais 15 segundos"
        >
          +15
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-touch rounded-control bg-accent px-4 font-bold text-accent-fg active:brightness-90"
        >
          Pular
        </button>
      </div>
    </section>
  )
}
