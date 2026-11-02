export const PLAN_COLORS = [
  'lime',
  'emerald',
  'cyan',
  'blue',
  'violet',
  'pink',
  'red',
  'orange',
  'amber',
] as const
export type PlanColor = (typeof PLAN_COLORS)[number]

/** Classes estáticas (o Tailwind precisa enxergar o nome completo). */
export const PLAN_COLOR_BG: Record<PlanColor, string> = {
  lime: 'bg-plan-lime',
  emerald: 'bg-plan-emerald',
  cyan: 'bg-plan-cyan',
  blue: 'bg-plan-blue',
  violet: 'bg-plan-violet',
  pink: 'bg-plan-pink',
  red: 'bg-plan-red',
  orange: 'bg-plan-orange',
  amber: 'bg-plan-amber',
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
