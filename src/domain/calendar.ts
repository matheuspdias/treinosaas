import type { Session } from './types'

/** Dia local no formato AAAA-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** Segunda-feira 00:00 (local) da semana de `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - dow)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Sessões concluídas agrupadas por dia local. */
export function sessionsByDay(sessions: readonly Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    const key = dayKey(new Date(s.startedAt))
    const list = map.get(key)
    if (list) list.push(s)
    else map.set(key, [s])
  }
  return map
}

export interface WeekStreak {
  /** Semanas seguidas com pelo menos um treino, até a semana atual. */
  current: number
  best: number
  /** Houve treino nesta semana? (se não, a sequência ainda está viva, mas em risco) */
  thisWeekActive: boolean
}

/**
 * Sequência de semanas ativas. A semana atual sem treino ainda não quebra a sequência:
 * conta-se a partir da semana passada.
 */
export function weekStreak(sessions: readonly Session[], now: Date = new Date()): WeekStreak {
  const weeks = new Set(
    sessions
      .filter((s) => s.status === 'completed')
      .map((s) => startOfWeek(new Date(s.startedAt)).getTime()),
  )
  const thisWeek = startOfWeek(now)
  const thisWeekActive = weeks.has(thisWeek.getTime())

  let current = 0
  let cursor = thisWeekActive ? thisWeek : addDays(thisWeek, -7)
  while (weeks.has(cursor.getTime())) {
    current++
    cursor = addDays(cursor, -7)
  }

  let best = 0
  let run = 0
  let prev: number | null = null
  for (const w of [...weeks].sort((a, b) => a - b)) {
    // Compara por data (addDays) para não errar na troca de horário de verão.
    run = prev !== null && addDays(new Date(prev), 7).getTime() === w ? run + 1 : 1
    best = Math.max(best, run)
    prev = w
  }
  return { current, best: Math.max(best, current), thisWeekActive }
}

/** Grade do mês começando na segunda-feira: semanas × 7 dias (inclui dias dos meses vizinhos). */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  let cursor = startOfWeek(first)
  const weeks: Date[][] = []
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)))
    cursor = addDays(cursor, 7)
  } while (cursor.getMonth() === month && cursor.getFullYear() === year)
  return weeks
}
