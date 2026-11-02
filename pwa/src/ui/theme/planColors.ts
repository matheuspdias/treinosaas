import type { PlanColor } from '@/domain/types'

/** Classes estáticas (o Tailwind precisa enxergar o nome completo). */
export const PLAN_COLOR_CLASS: Record<
  PlanColor,
  { bg: string; text: string; border: string; ring: string }
> = {
  lime: {
    bg: 'bg-plan-lime',
    text: 'text-plan-lime',
    border: 'border-plan-lime',
    ring: 'ring-plan-lime',
  },
  emerald: {
    bg: 'bg-plan-emerald',
    text: 'text-plan-emerald',
    border: 'border-plan-emerald',
    ring: 'ring-plan-emerald',
  },
  cyan: {
    bg: 'bg-plan-cyan',
    text: 'text-plan-cyan',
    border: 'border-plan-cyan',
    ring: 'ring-plan-cyan',
  },
  blue: {
    bg: 'bg-plan-blue',
    text: 'text-plan-blue',
    border: 'border-plan-blue',
    ring: 'ring-plan-blue',
  },
  violet: {
    bg: 'bg-plan-violet',
    text: 'text-plan-violet',
    border: 'border-plan-violet',
    ring: 'ring-plan-violet',
  },
  pink: {
    bg: 'bg-plan-pink',
    text: 'text-plan-pink',
    border: 'border-plan-pink',
    ring: 'ring-plan-pink',
  },
  red: {
    bg: 'bg-plan-red',
    text: 'text-plan-red',
    border: 'border-plan-red',
    ring: 'ring-plan-red',
  },
  orange: {
    bg: 'bg-plan-orange',
    text: 'text-plan-orange',
    border: 'border-plan-orange',
    ring: 'ring-plan-orange',
  },
  amber: {
    bg: 'bg-plan-amber',
    text: 'text-plan-amber',
    border: 'border-plan-amber',
    ring: 'ring-plan-amber',
  },
}

export const PLAN_COLOR_LABEL: Record<PlanColor, string> = {
  lime: 'Verde-limão',
  emerald: 'Esmeralda',
  cyan: 'Ciano',
  blue: 'Azul',
  violet: 'Violeta',
  pink: 'Rosa',
  red: 'Vermelho',
  orange: 'Laranja',
  amber: 'Âmbar',
}
