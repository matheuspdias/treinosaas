const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const shortFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const numberFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Aceita ISO completo ou só a data (AAAA-MM-DD, interpretada no fuso local). */
export function toDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
}

export const formatDate = (v: string) => dateFmt.format(toDate(v))
export const formatDateShort = (v: string) => shortFmt.format(toDate(v))
export const formatDateTime = (v: string) => dateTimeFmt.format(toDate(v)).replace(',', ' às')
export const formatNumber = (v: number) => numberFmt.format(v)
export const formatWeight = (kg: number) => `${numberFmt.format(kg)} kg`

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

export function formatRest(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m}min${s}s` : `${m}min`
}

/** "hoje", "ontem", "há 5 dias", "há 3 semanas"... */
export function relativeDays(iso: string | null, empty = 'nunca'): string {
  if (!iso) return empty
  const days = Math.floor((Date.now() - toDate(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 14) return `há ${days} dias`
  if (days < 60) return `há ${Math.floor(days / 7)} semanas`
  return `há ${Math.floor(days / 30)} meses`
}

/** Dias até a data (negativo = já passou). */
export function daysUntil(date: string): number {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((toDate(date).getTime() - today.getTime()) / 86_400_000)
}

export function validityLabel(expiresOn: string | null): string | null {
  if (!expiresOn) return null
  const d = daysUntil(expiresOn)
  if (d < 0) return `Venceu em ${formatDateShort(expiresOn)}`
  if (d === 0) return 'Vence hoje'
  if (d <= 7) return `Vence em ${d} ${d === 1 ? 'dia' : 'dias'}`
  return `Válido até ${formatDateShort(expiresOn)}`
}

/** Data local AAAA-MM-DD daqui a `weeks` semanas. */
export function isoDateInWeeks(weeks: number): string {
  const d = new Date()
  d.setDate(d.getDate() + weeks * 7)
  return toIsoDate(d)
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Máscara de celular enquanto digita: (11) 91234-5678. */
export function maskPhone(raw: string): string {
  const d = raw
    .replace(/\D/g, '')
    .replace(/^55(?=\d{11})/, '')
    .slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
