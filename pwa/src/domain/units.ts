import type { WeightUnit } from './types'

export const KG_PER_LB = 0.45359237

export const UNIT_LABEL: Record<WeightUnit, string> = { kg: 'kg', lb: 'lb' }

/** Converte kg (formato interno) para a unidade de exibição. */
export function toDisplayUnit(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

/** Converte da unidade de exibição para kg (formato interno). */
export function fromDisplayUnit(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB
}

const numberFormatters = new Map<number, Intl.NumberFormat>()

export function formatNumber(value: number, maxFractionDigits = 2): string {
  let fmt = numberFormatters.get(maxFractionDigits)
  if (!fmt) {
    fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxFractionDigits })
    numberFormatters.set(maxFractionDigits, fmt)
  }
  return fmt.format(value)
}

/** "62,5 kg". Em lb arredonda para 0,1. */
export function formatWeight(kg: number, unit: WeightUnit, withUnit = true): string {
  const value = toDisplayUnit(kg, unit)
  const text = formatNumber(value, unit === 'kg' ? 2 : 1)
  return withUnit ? `${text} ${UNIT_LABEL[unit]}` : text
}

/** Volume total: sem casas decimais e com separador de milhar ("12.450 kg"). */
export function formatVolume(kg: number, unit: WeightUnit): string {
  return `${formatNumber(Math.round(toDisplayUnit(kg, unit)), 0)} ${UNIT_LABEL[unit]}`
}

/** Aceita "2,5", "2.5", " 10 ". Retorna null se não for um número válido e não negativo. */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (trimmed === '' || !/^\d*\.?\d*$/.test(trimmed) || trimmed === '.') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/** Lê o que o usuário digitou (na unidade de exibição) e devolve kg. */
export function parseWeightInput(input: string, unit: WeightUnit): number | null {
  const value = parseDecimal(input)
  return value === null ? null : roundKg(fromDisplayUnit(value, unit))
}

/** Evita lixo de ponto flutuante (ex.: 22.500000001). */
export function roundKg(kg: number): number {
  return Math.round(kg * 1000) / 1000
}
