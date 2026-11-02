import type { Session } from './types'

/** 75 → "1:15"; 3725 → "1:02:05". */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** 3725 → "1h 02min"; 900 → "15 min"; 45 → "45 s". */
export function formatDurationLong(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  if (sec < 60) return `${sec} s`
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m} min`
}

export function sessionDurationSec(session: Session, now: Date = new Date()): number {
  const end = session.finishedAt ? new Date(session.finishedAt) : now
  return Math.max(0, (end.getTime() - new Date(session.startedAt).getTime()) / 1000)
}

export function restRemainingSec(endsAt: string, now: Date = new Date()): number {
  return Math.max(0, (new Date(endsAt).getTime() - now.getTime()) / 1000)
}
