import { Pencil, Plus, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import { repos } from '@/data'
import { useBodyMetrics, useSettings } from '@/data/hooks'
import { dayKey, parseDayKey } from '@/domain/calendar'
import { BODY_MEASURES } from '@/domain/types'
import type { BodyMeasure, BodyMetric, WeightUnit } from '@/domain/types'
import { formatNumber, formatWeight, fromDisplayUnit, roundKg, toDisplayUnit } from '@/domain/units'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { LineMetricChart } from '@/ui/charts/LineMetricChart'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { Chip } from '@/ui/components/Chip'
import { DecimalInput, FieldLabel, TextField } from '@/ui/components/Field'
import { EmptyState } from '@/ui/components/EmptyState'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { Sheet } from '@/ui/components/Sheet'
import { PageSpinner } from '@/ui/components/Spinner'
import { longDate, shortDate } from './format'

const MEASURE_LABEL: Record<BodyMeasure, string> = {
  waist: 'Cintura',
  chest: 'Peitoral',
  hips: 'Quadril',
  arm: 'Braço',
  thigh: 'Coxa',
  calf: 'Panturrilha',
}

type ChartKey = 'weight' | 'bodyFat' | BodyMeasure

function metricValue(m: BodyMetric, key: ChartKey): number | undefined {
  if (key === 'weight') return m.weightKg
  if (key === 'bodyFat') return m.bodyFatPct
  return m.measurementsCm[key]
}

export function BodyPage() {
  const metrics = useBodyMetrics()
  const { weightUnit: unit } = useSettings()
  const [editing, setEditing] = useState<BodyMetric | 'new' | null>(null)
  const [chartKey, setChartKey] = useState<ChartKey>('weight')

  const available = useMemo(() => {
    const keys: ChartKey[] = ['weight', 'bodyFat', ...BODY_MEASURES]
    return keys.filter((k) => (metrics ?? []).some((m) => metricValue(m, k) !== undefined))
  }, [metrics])

  if (!metrics) return <PageSpinner />
  const key = available.includes(chartKey) ? chartKey : (available[0] ?? 'weight')
  const points = metrics.flatMap((m) => {
    const v = metricValue(m, key)
    return v === undefined ? [] : [{ x: parseDayKey(m.date).getTime(), y: v }]
  })
  const fmt = (v: number) =>
    key === 'weight'
      ? formatWeight(v, unit)
      : key === 'bodyFat'
        ? `${formatNumber(v, 1)}%`
        : `${formatNumber(v, 1)} cm`
  const label = (k: ChartKey) =>
    k === 'weight' ? 'Peso' : k === 'bodyFat' ? '% gordura' : MEASURE_LABEL[k]
  const weights = metrics.filter((m) => m.weightKg !== undefined)
  const latest = weights.at(-1)
  const first = weights[0]

  return (
    <>
      <PageHeader
        back="/progresso"
        title="Peso e medidas"
        actions={
          <IconButton
            label="Novo registro"
            variant="primary"
            icon={<Plus className="size-6" />}
            onClick={() => setEditing('new')}
          />
        }
      />
      {metrics.length === 0 ? (
        <EmptyState
          icon={<Scale className="size-8" />}
          title="Nenhum registro"
          description="Registre seu peso e, se quiser, medidas como cintura e braço. Tudo é opcional."
          action={
            <Button
              size="lg"
              block
              icon={<Plus className="size-5" />}
              onClick={() => setEditing('new')}
            >
              Registrar agora
            </Button>
          }
        />
      ) : (
        <div className="space-y-6 px-4 pb-8">
          {latest?.weightKg !== undefined && (
            <Card className="p-5">
              <p className="text-sm text-fg-muted">
                Peso atual · {longDate.format(parseDayKey(latest.date))}
              </p>
              <p className="text-5xl font-extrabold tracking-tight">
                {formatWeight(latest.weightKg, unit)}
              </p>
              {first && first !== latest && first.weightKg !== undefined && (
                <p className="mt-1 text-fg-muted tabular">
                  {latest.weightKg - first.weightKg >= 0 ? '+' : '−'}
                  {formatWeight(
                    Math.abs(roundKg(latest.weightKg - first.weightKg)),
                    unit,
                  )} desde {shortDate.format(parseDayKey(first.date))}
                </p>
              )}
            </Card>
          )}

          {available.length > 0 && (
            <Card className="p-4">
              <div
                role="group"
                aria-label="Medida do gráfico"
                className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1"
              >
                {available.map((k) => (
                  <Chip key={k} selected={k === key} onClick={() => setChartKey(k)}>
                    {label(k)}
                  </Chip>
                ))}
              </div>
              {points.length >= 2 ? (
                <div className="mt-3">
                  <LineMetricChart
                    data={points}
                    label={`${label(key)}: de ${fmt(points[0]!.y)} a ${fmt(points.at(-1)!.y)} em ${points.length} registros`}
                    formatY={fmt}
                    formatX={(ms) => shortDate.format(new Date(ms))}
                    formatTooltipX={(ms) => longDate.format(new Date(ms))}
                  />
                </div>
              ) : (
                <p className="py-8 text-center text-fg-muted">
                  O gráfico aparece a partir do segundo registro.
                </p>
              )}
            </Card>
          )}

          <section aria-labelledby="entries-title">
            <h2 id="entries-title" className="mb-2 text-lg font-bold">
              Registros
            </h2>
            <Card>
              <ul className="divide-y divide-border">
                {[...metrics].reverse().map((m) => {
                  const parts = [
                    m.weightKg !== undefined && formatWeight(m.weightKg, unit),
                    m.bodyFatPct !== undefined && `${formatNumber(m.bodyFatPct, 1)}% gordura`,
                    ...BODY_MEASURES.filter((k) => m.measurementsCm[k] !== undefined).map(
                      (k) => `${MEASURE_LABEL[k]} ${formatNumber(m.measurementsCm[k]!, 1)} cm`,
                    ),
                  ].filter(Boolean)
                  return (
                    <li key={m.id} className="flex items-center gap-2 py-2 pr-2 pl-4">
                      <span className="min-w-0 flex-1 py-1">
                        <span className="block font-semibold">
                          {longDate.format(parseDayKey(m.date))}
                        </span>
                        <span className="block text-sm text-fg-muted">{parts.join(' · ')}</span>
                      </span>
                      <IconButton
                        label={`Editar registro de ${longDate.format(parseDayKey(m.date))}`}
                        icon={<Pencil className="size-5" />}
                        onClick={() => setEditing(m)}
                      />
                    </li>
                  )
                })}
              </ul>
            </Card>
          </section>
        </div>
      )}
      <BodyMetricSheet
        metric={editing}
        existing={metrics}
        unit={unit}
        onClose={() => setEditing(null)}
      />
    </>
  )
}

function BodyMetricSheet({
  metric,
  existing,
  unit,
  onClose,
}: {
  metric: BodyMetric | 'new' | null
  existing: BodyMetric[]
  unit: WeightUnit
  onClose: () => void
}) {
  return (
    <Sheet
      open={metric !== null}
      onClose={onClose}
      title={metric === 'new' ? 'Novo registro' : 'Editar registro'}
    >
      {metric !== null && (
        <BodyMetricForm
          key={metric === 'new' ? 'new' : metric.id}
          metric={metric === 'new' ? null : metric}
          existing={existing}
          unit={unit}
          onClose={onClose}
        />
      )}
    </Sheet>
  )
}

function BodyMetricForm({
  metric,
  existing,
  unit,
  onClose,
}: {
  metric: BodyMetric | null
  existing: BodyMetric[]
  unit: WeightUnit
  onClose: () => void
}) {
  const today = dayKey(new Date())
  const [date, setDate] = useState(metric?.date ?? today)
  const [weight, setWeight] = useState<number | null>(
    metric?.weightKg !== undefined
      ? Math.round(toDisplayUnit(metric.weightKg, unit) * 10) / 10
      : null,
  )
  const [fat, setFat] = useState<number | null>(metric?.bodyFatPct ?? null)
  const [measures, setMeasures] = useState<Partial<Record<BodyMeasure, number | null>>>(
    metric?.measurementsCm ?? {},
  )
  const [error, setError] = useState('')

  const save = async () => {
    const measurementsCm = Object.fromEntries(
      Object.entries(measures).filter(([, v]) => v !== null && v !== undefined && v > 0),
    ) as BodyMetric['measurementsCm']
    if (
      (weight === null || weight <= 0) &&
      (fat === null || fat <= 0) &&
      Object.keys(measurementsCm).length === 0
    ) {
      setError('Preencha pelo menos um valor.')
      return
    }
    if (fat !== null && fat > 100) {
      setError('Percentual de gordura deve ser até 100.')
      return
    }
    // Um registro por dia: se já existe outro no mesmo dia, ele é atualizado.
    const sameDay = existing.find((m) => m.date === date && m.id !== metric?.id)
    const base = sameDay ?? metric
    const now = new Date().toISOString()
    const next: BodyMetric = {
      id: base?.id ?? crypto.randomUUID(),
      createdAt: base?.createdAt ?? now,
      updatedAt: now,
      date,
      measurementsCm,
      ...(weight !== null && weight > 0
        ? { weightKg: roundKg(fromDisplayUnit(weight, unit)) }
        : {}),
      ...(fat !== null && fat > 0 ? { bodyFatPct: fat } : {}),
    }
    await repos.bodyMetrics.save(next)
    if (sameDay && metric) await repos.bodyMetrics.remove(metric.id)
    toast(sameDay ? 'Registro do dia atualizado.' : 'Registro salvo.', { tone: 'success' })
    onClose()
  }

  const remove = async () => {
    if (!metric) return
    const ok = await confirm({
      title: 'Excluir registro?',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return
    await repos.bodyMetrics.remove(metric.id)
    toast('Registro excluído.')
    onClose()
  }

  return (
    <div className="space-y-5 pt-2 pb-2">
      <TextField
        label="Data"
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && setDate(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="bm-weight">Peso ({unit})</FieldLabel>
          <DecimalInput
            id="bm-weight"
            value={weight}
            maxFractionDigits={1}
            onValueChange={setWeight}
            placeholder="—"
          />
        </div>
        <div>
          <FieldLabel htmlFor="bm-fat">Gordura (%)</FieldLabel>
          <DecimalInput
            id="bm-fat"
            value={fat}
            maxFractionDigits={1}
            onValueChange={setFat}
            placeholder="—"
          />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-fg-muted">
          Medidas (cm), opcionais
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {BODY_MEASURES.map((k) => (
            <div key={k}>
              <FieldLabel htmlFor={`bm-${k}`}>{MEASURE_LABEL[k]}</FieldLabel>
              <DecimalInput
                id={`bm-${k}`}
                value={measures[k] ?? null}
                maxFractionDigits={1}
                onValueChange={(v) => setMeasures((m) => ({ ...m, [k]: v }))}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button size="lg" block onClick={() => void save()}>
        Salvar
      </Button>
      {metric && (
        <Button variant="danger" block onClick={() => void remove()}>
          Excluir registro
        </Button>
      )}
    </div>
  )
}
