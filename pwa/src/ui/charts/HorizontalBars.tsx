export interface HBar {
  key: string
  label: string
  value: number
  valueLabel: string
  detail?: string
}

/**
 * Barras horizontais em HTML (mais acessível que SVG para listas curtas):
 * rótulo à esquerda, valor na ponta, uma única cor. Também serve de tabela.
 */
export function HorizontalBars({ data, label }: { data: HBar[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul aria-label={label} className="space-y-2.5">
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
          <span className="truncate text-sm font-medium">{d.label}</span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 rounded-r-[4px] bg-chart"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                maxWidth: 'calc(100% - 4.5rem)',
              }}
              aria-hidden
            />
            <span className="shrink-0 text-sm text-fg-muted tabular">
              <span className="font-semibold text-fg">{d.valueLabel}</span>
              {d.detail && <span className="sr-only">, {d.detail}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
