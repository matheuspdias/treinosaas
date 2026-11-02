import type { BodyMeasure } from '@/domain/types'
export const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
export const longDate = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
export const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
export const weekdayShort = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
export const weekdayLong = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

/** Arredonda 1RM (valor estimado) a 0,5. */
export function roundHalf(v: number): number {
  return Math.round(v * 2) / 2
}

export const MEASURE_LABEL: Record<BodyMeasure, string> = {
  waist: 'Cintura',
  chest: 'Peitoral',
  hips: 'Quadril',
  arm: 'Braço',
  thigh: 'Coxa',
  calf: 'Panturrilha',
}
