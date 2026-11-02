import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../cn'

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex min-h-touch items-center gap-4 py-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-40',
          'before:absolute before:-inset-2 before:content-[""]',
          checked ? 'bg-accent' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block size-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-7' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
