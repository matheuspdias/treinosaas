import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { DecimalInput, FieldLabel } from './Field'

export interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  /** Unidade, mostrada no rótulo: "Carga (kg)". */
  suffix?: string
  maxFractionDigits?: number
  className?: string
  hint?: string
}

/** Campo numérico com botões − e + grandes (uso com uma mão). */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  maxFractionDigits = 0,
  className,
  hint,
}: StepperProps) {
  const id = useId()
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 1000) / 1000))
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
        {suffix && <span className="font-normal text-fg-subtle"> ({suffix})</span>}
      </FieldLabel>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="flex size-touch shrink-0 items-center justify-center rounded-control bg-surface-2 active:bg-surface-3 disabled:opacity-40"
        >
          <Minus className="size-5" />
        </button>
        <DecimalInput
          id={id}
          value={value}
          maxFractionDigits={maxFractionDigits}
          onValueChange={(v) => v !== null && onChange(clamp(v))}
          className="min-w-0 flex-1 px-1"
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="flex size-touch shrink-0 items-center justify-center rounded-control bg-surface-2 active:bg-surface-3 disabled:opacity-40"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  )
}
