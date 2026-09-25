import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../cn'

export function Chip({
  selected,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors',
        selected
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-border bg-surface text-fg active:bg-surface-2',
        className,
      )}
      {...rest}
    />
  )
}
