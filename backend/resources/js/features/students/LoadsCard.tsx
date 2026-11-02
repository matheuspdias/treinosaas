import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatDateShort, formatWeight } from '@/lib/format'
import { LineMetricChart } from '@/ui/charts/LineMetricChart'
import { Card } from '@/ui/components/Card'
import { SelectField } from '@/ui/components/Field'
import type { LoadSeries } from './types'

/** Evolução de carga por exercício: maior carga de trabalho de cada treino. */
export function LoadsCard({ loads }: { loads: LoadSeries[] }) {
  const [key, setKey] = useState(loads[0]?.key ?? '')
  const series = loads.find((l) => l.key === key) ?? loads[0]
  const withWeight = series?.points.filter((p) => p.weightKg !== null) ?? []

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="size-5 text-accent" />
        <h2 className="font-bold">Evolução de cargas</h2>
      </div>
      {!series ? (
        <p className="py-6 text-center text-fg-muted">
          As cargas aparecem aqui quando o aluno registrar treinos da academia no app.
        </p>
      ) : (
        <>
          <SelectField
            label="Exercício"
            value={series.key}
            onChange={(e) => setKey(e.target.value)}
          >
            {loads.map((l) => (
              <option key={l.key} value={l.key}>
                {l.name} ({l.points.length})
              </option>
            ))}
          </SelectField>
          {withWeight.length >= 2 && (
            <div className="mt-4">
              <LineMetricChart
                label={`Maior carga por treino em ${series.name}`}
                data={withWeight.map((p) => ({
                  x: new Date(`${p.day}T12:00:00`).getTime(),
                  y: p.weightKg!,
                }))}
                formatY={formatWeight}
                formatX={(ms) => formatDateShort(new Date(ms).toISOString())}
                formatTooltipX={(ms) => formatDate(new Date(ms).toISOString())}
              />
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-fg-muted">
                <tr>
                  <th className="py-2 font-semibold">Data</th>
                  <th className="py-2 text-right font-semibold">Maior carga</th>
                  <th className="py-2 text-right font-semibold">Reps</th>
                  <th className="py-2 text-right font-semibold">Séries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular">
                {[...series.points]
                  .reverse()
                  .slice(0, 10)
                  .map((p) => (
                    <tr key={p.day}>
                      <td className="py-2">{formatDate(p.day)}</td>
                      <td className="py-2 text-right font-semibold">
                        {p.weightKg === null ? '–' : formatWeight(p.weightKg)}
                      </td>
                      <td className="py-2 text-right">{p.reps ?? '–'}</td>
                      <td className="py-2 text-right">{p.sets}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
