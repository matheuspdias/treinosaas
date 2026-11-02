import type { ReactNode } from 'react'
import { cn } from '../cn'

export type BadgeTone = 'neutral' | 'accent' | 'warning' | 'danger' | 'success'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  accent: 'bg-accent-soft text-fg',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-accent-soft text-success',
}

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
