import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheckBig,
  Clock,
  Dumbbell,
  Minus,
  Trophy,
  Weight,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useCompletedSessions, useSession, useSettings } from '@/data/hooks'
import { compareSessions, findPreviousSessionOfPlan } from '@/domain/comparison'
import { formatDurationLong } from '@/domain/duration'
import { detectBrokenRecords, RECORD_LABEL } from '@/domain/records'
import type { BrokenRecord } from '@/domain/records'
import type { WeightUnit } from '@/domain/types'
import { formatNumber, formatVolume, formatWeight } from '@/domain/units'
import { completedWorkSets } from '@/domain/volume'
import { cn } from '@/ui/cn'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageSpinner } from '@/ui/components/Spinner'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDateFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 text-sm text-fg-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight tabular">{value}</p>
    </Card>
  )
}

function Delta({
  current,
  previous,
  format,
}: {
  current: number | null
  previous: number | null
  format: (v: number) => string
}) {
  if (current === null || previous === null) return <span className="text-fg-subtle">—</span>
  const diff = current - previous
  if (Math.abs(diff) < 1e-9) {
    return (
      <span className="inline-flex items-center gap-0.5 text-fg-muted">
        <Minus className="size-4" aria-hidden />
        igual
      </span>
    )
  }
  const up = diff > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-semibold tabular',
        up ? 'text-success' : 'text-danger',
      )}
    >
      {up ? (
        <ArrowUpRight className="size-4" aria-hidden />
      ) : (
        <ArrowDownRight className="size-4" aria-hidden />
      )}
      {up ? '+' : '−'}
      {format(Math.abs(diff))}
    </span>
  )
}

function formatRecord(r: BrokenRecord, unit: WeightUnit): { value: string; previous: string } {
  if (r.type === 'setVolume')
    return { value: formatVolume(r.value, unit), previous: formatVolume(r.previous, unit) }
  return {
    value: formatWeight(Math.round(r.value * 10) / 10, unit),
    previous: formatWeight(Math.round(r.previous * 10) / 10, unit),
  }
}

export function SummaryPage() {
  const { sessionId } = useParams()
  const session = useSession(sessionId)
  const history = useCompletedSessions()
  const { weightUnit: unit } = useSettings()

  const data = useMemo(() => {
    if (!session || !history) return null
    const before = history.filter((s) => s.id !== session.id && s.startedAt < session.startedAt)
    const previous = findPreviousSessionOfPlan(session, before)
    return {
      records: detectBrokenRecords(session, before),
      previous,
      comparison: compareSessions(session, previous),
    }
  }, [session, history])

  if (session === undefined || history === undefined) return <PageSpinner />
  if (session === null || session.status !== 'completed' || !data) {
    return (
      <EmptyState
        title="Treino não encontrado"
        action={
          <Link to="/" className={buttonClass({ block: true })}>
            Ir para o início
          </Link>
        }
      />
    )
  }

  const { records, previous, comparison: c } = data

  return (
    <div className="px-4 pt-6 safe-top pb-32">
      <div className="celebrate-in text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent text-accent-fg">
          <CircleCheckBig className="size-10" strokeWidth={2.4} />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Treino concluído!</h1>
        <p className="mt-1 flex items-center justify-center gap-2 text-fg-muted">
          <span
            className={cn('size-2.5 rounded-full', PLAN_COLOR_CLASS[session.planColor].bg)}
            aria-hidden
          />
          {session.planName} ·{' '}
          <span className="first-letter:uppercase">
            {dateFmt.format(new Date(session.startedAt))}
          </span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat
          icon={<Clock className="size-4" aria-hidden />}
          label="Duração"
          value={formatDurationLong(c.durationSec)}
        />
        <Stat
          icon={<Weight className="size-4" aria-hidden />}
          label="Volume"
          value={formatVolume(c.volume, unit)}
        />
        <Stat
          icon={<Dumbbell className="size-4" aria-hidden />}
          label="Séries"
          value={completedWorkSets(session)}
        />
        <Stat
          icon={<Trophy className="size-4" aria-hidden />}
          label="Recordes"
          value={records.length}
        />
      </div>

      {records.length > 0 && (
        <section className="mt-8" aria-labelledby="records-title">
          <h2 id="records-title" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Trophy className="size-5 text-warning" aria-hidden />
            Recordes batidos
          </h2>
          <ul className="space-y-2">
            {records.map((r) => {
              const f = formatRecord(r, unit)
              return (
                <li
                  key={`${r.exercise.id}-${r.type}`}
                  className="record-glow rounded-card border border-warning/40 bg-warning-soft p-4"
                >
                  <p className="font-bold">{r.exerciseName}</p>
                  <p className="text-sm text-fg-muted">{RECORD_LABEL[r.type]}</p>
                  <p className="mt-1 tabular">
                    <span className="text-xl font-extrabold">{f.value}</span>{' '}
                    <span className="text-sm text-fg-muted">antes {f.previous}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="compare-title">
        <h2 id="compare-title" className="text-lg font-bold">
          Comparação com o treino anterior
        </h2>
        {previous ? (
          <>
            <p className="mb-3 text-sm text-fg-muted">
              {session.planName} em {shortDateFmt.format(new Date(previous.startedAt))}
            </p>
            <Card className="mb-3 grid grid-cols-2 divide-x divide-border">
              <div className="p-4">
                <p className="text-sm text-fg-muted">Volume</p>
                <p className="mt-1">
                  <Delta
                    current={c.volume}
                    previous={c.previousVolume}
                    format={(v) => formatVolume(v, unit)}
                  />
                </p>
                {c.volumeChange !== null && (
                  <p className="text-sm text-fg-subtle tabular">
                    {formatNumber(c.volumeChange * 100, 0)}%
                  </p>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-fg-muted">Duração</p>
                <p className="mt-1">
                  <Delta
                    current={Math.round(c.durationSec / 60)}
                    previous={
                      c.previousDurationSec === null ? null : Math.round(c.previousDurationSec / 60)
                    }
                    format={(v) => `${v} min`}
                  />
                </p>
              </div>
            </Card>
            <Card>
              <ul className="divide-y divide-border">
                {c.exercises.map((e) => (
                  <li key={e.key} className="p-4">
                    <p className="font-semibold">{e.name}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="text-fg-muted">Carga máx. </span>
                        <span className="font-semibold tabular">
                          {e.topWeight === null ? '—' : formatWeight(e.topWeight, unit)}
                        </span>{' '}
                        <Delta
                          current={e.topWeight}
                          previous={e.previousTopWeight}
                          format={(v) => formatWeight(v, unit)}
                        />
                      </p>
                      <p>
                        <span className="text-fg-muted">Volume </span>
                        <Delta
                          current={e.volume}
                          previous={e.previousVolume}
                          format={(v) => formatVolume(v, unit)}
                        />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : (
          <p className="mt-1 text-fg-muted">
            Primeira vez com esta ficha. Da próxima vez você verá a evolução aqui.
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent pt-6 safe-bottom">
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <Link to="/" replace className={buttonClass({ block: true, size: 'lg' })}>
            Concluir
          </Link>
        </div>
      </div>
    </div>
  )
}
