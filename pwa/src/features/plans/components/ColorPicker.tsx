import { Check } from 'lucide-react'
import { PLAN_COLORS } from '@/domain/types'
import type { PlanColor } from '@/domain/types'
import { cn } from '@/ui/cn'
import { PLAN_COLOR_CLASS, PLAN_COLOR_LABEL } from '@/ui/theme/planColors'

export function ColorPicker({
  value,
  onChange,
}: {
  value: PlanColor
  onChange: (color: PlanColor) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Cor da ficha"
      className="grid grid-cols-5 gap-3 sm:grid-cols-9"
    >
      {PLAN_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={PLAN_COLOR_LABEL[color]}
          onClick={() => onChange(color)}
          className={cn(
            'flex aspect-square min-h-touch items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform active:scale-95',
            PLAN_COLOR_CLASS[color].bg,
            value === color && `ring-3 ${PLAN_COLOR_CLASS[color].ring}`,
          )}
        >
          {value === color && <Check className="size-6 text-black/80" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}
