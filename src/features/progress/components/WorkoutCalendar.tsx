import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { dayKey, monthGrid } from '@/domain/calendar'
import type { Session } from '@/domain/types'
import { cn } from '@/ui/cn'
import { IconButton } from '@/ui/components/IconButton'
import { Sheet } from '@/ui/components/Sheet'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'
import { longDate, monthYear, weekdayLong, weekdayShort } from '../format'

/** Calendário mensal: dias com treino ganham a cor da ficha; tocar abre o treino. */
export function WorkoutCalendar({ byDay }: { byDay: Map<string, Session[]> }) {
  const navigate = useNavigate()
  const today = new Date()
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [picked, setPicked] = useState<Session[] | null>(null)
  const grid = monthGrid(cursor.y, cursor.m)
  const todayKey = dayKey(today)
  const isCurrentMonth = cursor.y === today.getFullYear() && cursor.m === today.getMonth()
  const monthCount = grid
    .flat()
    .filter((d) => d.getMonth() === cursor.m)
    .reduce((n, d) => n + (byDay.get(dayKey(d))?.length ?? 0), 0)

  const shift = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const open = (sessions: Session[]) => {
    if (sessions.length === 1) navigate(`/treino/${sessions[0]!.id}/resumo`)
    else setPicked(sessions)
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        <IconButton
          label="Mês anterior"
          icon={<ChevronLeft className="size-6" />}
          onClick={() => shift(-1)}
        />
        <div className="flex-1 text-center">
          <p className="font-bold first-letter:uppercase" aria-live="polite">
            {monthYear.format(new Date(cursor.y, cursor.m, 1))}
          </p>
          <p className="text-sm text-fg-muted">
            {monthCount === 1 ? '1 treino' : `${monthCount} treinos`}
          </p>
        </div>
        <IconButton
          label="Próximo mês"
          icon={<ChevronRight className="size-6" />}
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
        />
      </div>
      <table className="w-full table-fixed border-separate border-spacing-y-1 text-center">
        <thead>
          <tr>
            {weekdayShort.map((d, i) => (
              <th key={i} scope="col" className="pb-1 text-xs font-semibold text-fg-subtle">
                <abbr title={weekdayLong[i]} className="no-underline">
                  {d}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week, wi) => (
            <tr key={wi}>
              {week.map((day) => {
                const key = dayKey(day)
                const sessions = byDay.get(key) ?? []
                const inMonth = day.getMonth() === cursor.m
                const trained = sessions.length > 0
                const color = sessions[0]?.planColor
                const label = `${longDate.format(day)}${trained ? `: ${sessions.map((s) => s.planName).join(', ')}` : ''}`
                return (
                  <td key={key} className="p-0">
                    {trained ? (
                      <button
                        type="button"
                        aria-label={label}
                        onClick={() => open(sessions)}
                        className={cn(
                          'mx-auto flex size-11 items-center justify-center rounded-full text-sm font-bold text-black/85 active:scale-95',
                          color && PLAN_COLOR_CLASS[color].bg,
                          !inMonth && 'opacity-40',
                          key === todayKey && 'ring-2 ring-fg ring-offset-2 ring-offset-surface',
                        )}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <span
                        aria-label={label}
                        className={cn(
                          'mx-auto flex size-11 items-center justify-center rounded-full text-sm',
                          inMonth ? 'text-fg-muted' : 'text-fg-subtle/50',
                          key === todayKey && 'font-bold text-fg ring-2 ring-border',
                        )}
                      >
                        {day.getDate()}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Sheet open={picked !== null} onClose={() => setPicked(null)} title="Treinos do dia">
        <ul className="space-y-1 pb-2">
          {picked?.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => navigate(`/treino/${s.id}/resumo`)}
                className="flex min-h-14 w-full items-center gap-3 rounded-card px-3 text-left active:bg-surface-2"
              >
                <span
                  className={cn('size-3 rounded-full', PLAN_COLOR_CLASS[s.planColor].bg)}
                  aria-hidden
                />
                <span className="flex-1 font-semibold">{s.planName}</span>
                <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
