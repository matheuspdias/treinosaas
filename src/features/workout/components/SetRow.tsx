export const SET_GRID = 'grid grid-cols-[2.75rem_minmax(0,1fr)_5rem_4rem_3rem] gap-x-1.5'
import { Check } from 'lucide-react'
import type { SetLog, WeightUnit } from '@/domain/types'
import { formatWeight, fromDisplayUnit, roundKg, toDisplayUnit } from '@/domain/units'
import { cn } from '@/ui/cn'
import { DecimalInput } from '@/ui/components/Field'

interface Props {
  set: SetLog
  /** Rótulo: "1", "2"... ou "A" para aquecimento. */
  label: string
  previous: SetLog | undefined
  unit: WeightUnit
  onChange: (patch: Partial<Pick<SetLog, 'weightKg' | 'reps'>>) => void
  onToggleDone: () => void
  onOpenMenu: () => void
}

export function SetRow({ set, label, previous, unit, onChange, onToggleDone, onOpenMenu }: Props) {
  const done = !!set.completedAt
  const setName = set.isWarmup ? 'aquecimento' : `série ${label}`
  const display =
    set.weightKg === null ? null : Math.round(toDisplayUnit(set.weightKg, unit) * 100) / 100

  return (
    <div
      className={cn(
        SET_GRID,
        'items-center rounded-control px-1 py-1 transition-colors',
        done && 'bg-accent-soft',
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={`Opções da ${setName}`}
        className={cn(
          'flex size-11 items-center justify-center rounded-full text-sm font-bold',
          set.isWarmup ? 'bg-warning-soft text-warning' : 'bg-surface-2 text-fg-muted',
        )}
      >
        {label}
      </button>
      <span
        className="truncate text-center text-sm text-fg-subtle tabular"
        aria-label={
          previous
            ? `Anterior: ${formatWeight(previous.weightKg ?? 0, unit)} por ${previous.reps ?? 0}`
            : 'Sem registro anterior'
        }
      >
        {previous && previous.weightKg !== null && previous.reps !== null
          ? `${formatWeight(previous.weightKg, unit, false)} × ${previous.reps}`
          : '—'}
      </span>
      <DecimalInput
        aria-label={`Carga da ${setName} (${unit})`}
        value={display}
        maxFractionDigits={2}
        onValueChange={(v) =>
          onChange({ weightKg: v === null ? null : roundKg(fromDisplayUnit(v, unit)) })
        }
        className={cn('px-1 text-lg', done && 'border-transparent bg-transparent')}
      />
      <DecimalInput
        aria-label={`Repetições da ${setName}`}
        value={set.reps}
        maxFractionDigits={0}
        onValueChange={(v) => onChange({ reps: v === null ? null : Math.round(v) })}
        className={cn('px-1 text-lg', done && 'border-transparent bg-transparent')}
      />
      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={done}
        aria-label={done ? `Desmarcar ${setName}` : `Concluir ${setName}`}
        className={cn(
          'flex size-touch items-center justify-center rounded-control transition-[background-color,transform] active:scale-95',
          done ? 'bg-success text-bg' : 'bg-surface-2 text-fg-subtle',
        )}
      >
        <Check className="size-6" strokeWidth={3} />
      </button>
    </div>
  )
}
