import { CalendarDays } from 'lucide-react'
import { toIsoDate } from '@/lib/format'
import { cn } from '@/ui/cn'
import { Card } from '@/ui/components/Card'

const WEEKS = 12
const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const dayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' })

/** Frequência das últimas 12 semanas: uma coluna por semana (seg → dom), dia treinado preenchido. */
export function FrequencyCard({ trainingDays }: { trainingDays: string[] }) {
  const trained = new Set(trainingDays)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7)

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      return date
    }),
  )
  const last30 = trainingDays.filter(
    (d) => today.getTime() - new Date(`${d}T12:00:00`).getTime() < 30 * 86_400_000,
  ).length
  const perWeek = (trainingDays.length / WEEKS).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <CalendarDays className="size-5 text-accent" />
        <h2 className="font-bold">Frequência</h2>
      </div>
      <p className="mb-4 text-sm text-fg-muted">
        <strong className="text-fg tabular">{last30}</strong> treinos nos últimos 30 dias · média de{' '}
        <strong className="text-fg tabular">{perWeek}</strong> por semana
      </p>
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label={`${trainingDays.length} dias de treino nas últimas ${WEEKS} semanas`}
      >
        {weeks.map((days, w) => (
          <div key={w} className="flex flex-col gap-1">
            <span className="h-4 text-[10px] text-fg-subtle">
              {days[0]!.getDate() <= 7 ? monthFmt.format(days[0]!).replace('.', '') : ''}
            </span>
            {days.map((date) => {
              const iso = toIsoDate(date)
              const future = date > today
              return (
                <span
                  key={iso}
                  title={
                    future
                      ? undefined
                      : `${dayFmt.format(date)}${trained.has(iso) ? ': treinou' : ''}`
                  }
                  className={cn(
                    'size-5 rounded-[5px] sm:size-6',
                    future ? 'bg-transparent' : trained.has(iso) ? 'bg-chart' : 'bg-surface-2',
                  )}
                />
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}
