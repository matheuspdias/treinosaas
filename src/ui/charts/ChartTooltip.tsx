import type { ReactNode } from 'react'

/** Caixa de tooltip dos gráficos: texto sempre em tokens de texto, nunca na cor da série. */
export function ChartTooltipBox({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-control border border-border bg-surface px-3 py-2 text-sm shadow-sheet">
      <p className="text-fg-muted">{title}</p>
      <div className="font-bold text-fg tabular">{children}</div>
    </div>
  )
}
