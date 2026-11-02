function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 4 meses" (dias do calendário local). */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 14) return `há ${days} dias`
  if (days < 60) return `há ${Math.floor(days / 7)} semanas`
  const months = Math.floor(days / 30)
  return months < 12
    ? `há ${months} meses`
    : `há ${Math.floor(days / 365)} ${days < 730 ? 'ano' : 'anos'}`
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Boa noite'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
