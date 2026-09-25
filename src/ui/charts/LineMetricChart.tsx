import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltipBox } from './ChartTooltip'
import { niceScale } from './niceScale'
import { useChartTheme } from './useChartTheme'

export interface LinePoint {
  /** Timestamp (ms). */
  x: number
  y: number
}

interface Props {
  data: LinePoint[]
  /** Descrição para leitores de tela (o gráfico em si é decorativo; a lista abaixo é a tabela). */
  label: string
  formatY: (v: number) => string
  formatX: (ms: number) => string
  formatTooltipX?: (ms: number) => string
  height?: number
}

/**
 * Evolução de uma única medida no tempo: linha de 2px, área a ~10%,
 * ponto final destacado com rótulo, grade horizontal discreta e cruz + tooltip ao tocar.
 */
export function LineMetricChart({
  data,
  label,
  formatY,
  formatX,
  formatTooltipX = formatX,
  height = 220,
}: Props) {
  const t = useChartTheme()
  const last = data.at(-1)
  const ys = data.map((d) => d.y)
  const { domain, ticks } = niceScale(Math.min(...ys), Math.max(...ys))

  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={t.grid} strokeWidth={1} />
          <XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatX}
            tick={{ fill: t.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: t.grid }}
            minTickGap={24}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            domain={domain}
            ticks={ticks}
            tickFormatter={formatY}
            tick={{ fill: t.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: t.textMuted, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as LinePoint | undefined
              if (!active || !p) return null
              return <ChartTooltipBox title={formatTooltipX(p.x)}>{formatY(p.y)}</ChartTooltipBox>
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke="none"
            fill={t.series}
            fillOpacity={0.1}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={t.series}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
            dot={
              data.length <= 12
                ? { r: 4, fill: t.series, stroke: t.surface, strokeWidth: 2 }
                : false
            }
            activeDot={{ r: 6, fill: t.series, stroke: t.surface, strokeWidth: 2 }}
            label={({
              index,
              x,
              y,
            }: {
              index?: number
              x?: number | string
              y?: number | string
            }) =>
              index === data.length - 1 && last ? (
                <text
                  x={Number(x)}
                  y={Number(y) - 12}
                  textAnchor="end"
                  fill={t.text}
                  fontSize={13}
                  fontWeight={700}
                >
                  {formatY(last.y)}
                </text>
              ) : null
            }
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
