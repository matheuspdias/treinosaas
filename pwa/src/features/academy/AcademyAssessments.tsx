import { ClipboardCheck } from 'lucide-react'
import { useAcademyFeed, useAcademySession, useSettings } from '@/data/hooks'
import { parseDayKey } from '@/domain/calendar'
import { BODY_MEASURES } from '@/domain/types'
import { formatNumber, formatWeight } from '@/domain/units'
import { longDate, MEASURE_LABEL, shortDate } from '@/features/progress/format'
import { LineMetricChart } from '@/ui/charts/LineMetricChart'
import { Card } from '@/ui/components/Card'

/** Avaliações físicas registradas pela academia (só leitura). */
export function AcademyAssessments() {
  const session = useAcademySession()
  const { assessments } = useAcademyFeed()
  const { weightUnit: unit } = useSettings()
  if (!session || assessments.length === 0) return null

  const weights = [...assessments]
    .filter((a) => a.weightKg !== null)
    .reverse()
    .map((a) => ({ x: parseDayKey(a.assessedOn).getTime(), y: a.weightKg! }))

  return (
    <section aria-labelledby="academy-assessments" className="space-y-3 px-4 pb-8">
      <h2 id="academy-assessments" className="flex items-center gap-2 text-lg font-bold">
        <ClipboardCheck className="size-5 text-accent" aria-hidden />
        Avaliações da academia
      </h2>
      {weights.length >= 2 && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold text-fg-muted">Peso nas avaliações</p>
          <LineMetricChart
            data={weights}
            label={`Peso: de ${formatWeight(weights[0]!.y, unit)} a ${formatWeight(weights.at(-1)!.y, unit)} em ${weights.length} avaliações`}
            formatY={(v) => formatWeight(v, unit)}
            formatX={(ms) => shortDate.format(new Date(ms))}
            formatTooltipX={(ms) => longDate.format(new Date(ms))}
          />
        </Card>
      )}
      <Card>
        <ul className="divide-y divide-border">
          {assessments.map((a) => {
            const parts = [
              a.weightKg !== null && formatWeight(a.weightKg, unit),
              a.bodyFatPct !== null && `${formatNumber(a.bodyFatPct, 1)}% gordura`,
              a.heightCm !== null && `${formatNumber(a.heightCm, 0)} cm de altura`,
              ...BODY_MEASURES.filter((k) => a.measurementsCm[k] !== undefined).map(
                (k) => `${MEASURE_LABEL[k]} ${formatNumber(a.measurementsCm[k]!, 1)} cm`,
              ),
            ].filter(Boolean)
            return (
              <li key={a.id} className="px-4 py-3">
                <p className="font-semibold">{longDate.format(parseDayKey(a.assessedOn))}</p>
                <p className="text-sm text-fg-muted">{parts.join(' · ')}</p>
                {a.notes && <p className="mt-1 text-sm whitespace-pre-line">{a.notes}</p>}
              </li>
            )
          })}
        </ul>
      </Card>
    </section>
  )
}
