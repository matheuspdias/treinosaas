import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltipBox } from './ChartTooltip'
import { useChartTheme } from './useChartTheme'

export interface Column {
  key: string
  label: string
  value: number
  tooltipTitle: string
  /** Coluna em destaque (ex.: semana atual); as demais ficam na cor de apoio. */
  highlight?: boolean
}

/** Colunas finas (≤ 24px), topo arredondado de 4px e base reta, com tooltip ao tocar. */
export function ColumnChart({
  data,
  label,
  formatValue,
  height = 180,
}: {
  data: Column[]
  label: string
  formatValue: (v: number) => string
  height?: number
}) {
  const t = useChartTheme()
  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={t.grid} strokeWidth={1} />
          <XAxis
            dataKey="label"
            tick={{ fill: t.textMuted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.grid }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: t.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={28}
            tickCount={4}
          />
          <Tooltip
            cursor={{ fill: t.grid, opacity: 0.6 }}
            content={({ active, payload }) => {
              const c = payload?.[0]?.payload as Column | undefined
              if (!active || !c) return null
              return (
                <ChartTooltipBox title={c.tooltipTitle}>{formatValue(c.value)}</ChartTooltipBox>
              )
            }}
          />
          <Bar
            dataKey="value"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            minPointSize={0}
          >
            {data.map((c) => (
              <Cell key={c.key} fill={c.highlight ? t.series : t.muted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
