import type { PlanColor } from '@/domain/types'
import { cn } from '@/ui/cn'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'

/** Quadrado com a letra da ficha na cor dela (A, B, C...). */
export function PlanBadge({
  letter,
  color,
  size = 'md',
  className,
}: {
  letter: string
  color: PlanColor
  size?: 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[0.875rem] font-extrabold text-black/85',
        PLAN_COLOR_CLASS[color].bg,
        size === 'md' ? 'size-12 text-xl' : 'size-16 text-3xl',
        className,
      )}
    >
      {letter}
    </span>
  )
}
