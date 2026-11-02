import type { ReactNode } from 'react'
import { cn } from '../cn'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-control bg-surface-2 p-1"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[0.625rem] px-3 text-sm font-semibold transition-colors',
            value === opt.value ? 'bg-surface text-fg shadow-card' : 'text-fg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
