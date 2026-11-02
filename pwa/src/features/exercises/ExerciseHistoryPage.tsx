import { ChevronRight, LineChart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCompletedSessions, useSettings } from '@/data/hooks'
import { exerciseHistory, personalRecords } from '@/domain/history'
import type { ExerciseSource } from '@/domain/types'
import { formatNumber, formatVolume, formatWeight, toDisplayUnit } from '@/domain/units'
import { longDate, roundHalf, shortDate } from '@/features/progress/format'
import { LineMetricChart } from '@/ui/charts/LineMetricChart'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { PageSpinner } from '@/ui/components/Spinner'
import { useExerciseLookup } from './hooks/useExerciseLookup'

type Metric = 'weight' | 'e1rm' | 'volume'

const METRIC_LABEL: Record<Metric, string> = {
  weight: 'Carga máxima',
  e1rm: '1RM estimado',
  volume: 'Volume',
}

export function ExerciseHistoryPage() {
  const params = useParams()
  const ref = useMemo(
    () => ({ source: (params.source ?? 'catalog') as ExerciseSource, id: params.id ?? '' }),
    [params.source, params.id],
  )
  const sessions = useCompletedSessions()
  const lookup = useExerciseLookup()
  const { weightUnit: unit } = useSettings()
  const [metric, setMetric] = useState<Metric>('weight')

  const history = useMemo(
    () => (sessions ? exerciseHistory(sessions, ref) : undefined),
    [sessions, ref],
  )
  const records = useMemo(() => {
    if (!sessions) return undefined
    const key = `${ref.source}:${ref.id}`
    return personalRecords(sessions).find((r) => `${r.exercise.source}:${r.exercise.id}` === key)
  }, [sessions, ref])

  if (!history || !lookup.ready) return <PageSpinner />
  // Exercício personalizado excluído: usa o nome registrado no histórico.
  const name =
    lookup.get(ref)?.name ??
    sessions
      ?.flatMap((s) => s.exercises)
      .find((e) => e.exercise.source === ref.source && e.exercise.id === ref.id)?.exerciseName ??
    'Exercício'

  const fmtY = (v: number) =>
    metric === 'volume'
      ? formatVolume(v, unit)
      : formatWeight(metric === 'e1rm' ? roundHalf(v) : v, unit)
  const points = history.map((p) => ({
    x: new Date(p.date).getTime(),
    y: metric === 'weight' ? p.maxWeightKg : metric === 'e1rm' ? p.e1rmKg : p.volumeKg,
  }))

  return (
    <>
      <PageHeader back title="Histórico" subtitle={name} />
      {history.length === 0 ? (
        <EmptyState
          icon={<LineChart className="size-8" />}
          title="Sem registros ainda"
          description="Assim que você concluir um treino com este exercício, a evolução aparece aqui."
        />
      ) : (
        <div className="space-y-6 px-4 pb-8">
          {records && (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['Maior carga', formatWeight(records.weight.value, unit), records.weight],
                  ['1RM estimado', formatWeight(roundHalf(records.e1rm.value), unit), records.e1rm],
                  ['Volume/série', formatVolume(records.setVolume.value, unit), records.setVolume],
                ] as const
              ).map(([label, value, entry]) => (
                <Card key={label} className="p-3">
                  <p className="text-xs text-fg-muted">{label}</p>
                  <p className="mt-0.5 text-lg leading-tight font-extrabold">{value}</p>
                  <p className="mt-0.5 text-xs text-fg-subtle tabular">
                    {formatNumber(toDisplayUnit(entry.weightKg, unit), 1)}×{entry.reps} ·{' '}
                    {shortDate.format(new Date(entry.date))}
                  </p>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-4">
            <SegmentedControl<Metric>
              label="Métrica do gráfico"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'weight', label: 'Carga' },
                { value: 'e1rm', label: '1RM' },
                { value: 'volume', label: 'Volume' },
              ]}
            />
            <h2 className="mt-4 text-sm font-semibold text-fg-muted">
              {METRIC_LABEL[metric]} por treino{metric === 'e1rm' && ' (fórmula de Epley)'}
            </h2>
            {points.length >= 2 ? (
              <LineMetricChart
                data={points}
                label={`${METRIC_LABEL[metric]} de ${name} em ${points.length} treinos, de ${fmtY(points[0]!.y)} a ${fmtY(points.at(-1)!.y)}`}
                formatY={fmtY}
                formatX={(ms) => shortDate.format(new Date(ms))}
                formatTooltipX={(ms) => longDate.format(new Date(ms))}
              />
            ) : (
              <p className="py-8 text-center text-fg-muted">
                O gráfico aparece a partir do segundo treino.
              </p>
            )}
          </Card>

          <section aria-labelledby="sessions-title">
            <h2 id="sessions-title" className="mb-2 text-lg font-bold">
              Treinos ({history.length})
            </h2>
            <Card>
              <ul className="divide-y divide-border">
                {[...history].reverse().map((p) => (
                  <li key={p.sessionId}>
                    <Link
                      to={`/treino/${p.sessionId}/resumo`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {longDate.format(new Date(p.date))}{' '}
                          <span className="font-normal text-fg-muted">· {p.planName}</span>
                        </span>
                        <span className="block text-sm text-fg-muted tabular">
                          {p.workSets
                            .map(
                              (s) =>
                                `${formatNumber(toDisplayUnit(s.weightKg, unit), 1)}×${s.reps}`,
                            )
                            .join(' · ')}{' '}
                          {unit}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      )}
    </>
  )
}
