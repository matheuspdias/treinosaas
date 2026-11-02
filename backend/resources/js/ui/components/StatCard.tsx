import type { ReactNode } from 'react'
import { cn } from '../cn'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'warning'
}) {
  return (
    <Card className="flex flex-col gap-1 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 text-xs leading-tight font-semibold text-fg-muted sm:text-sm">
        <span>{label}</span>
        {icon && (
          <span
            className={cn(
              'hidden sm:inline',
              tone === 'warning' ? 'text-warning' : 'text-fg-subtle',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'text-2xl font-extrabold tracking-tight tabular sm:text-3xl',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-sm text-fg-subtle">{hint}</p>}
    </Card>
  )
}
