import { parseDayKey } from '@/domain/calendar'

export const ACADEMY_BADGE = 'Treino da academia'
export const PROFESSOR_NOTE = 'Observação do professor'

const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "02/11" a partir de AAAA-MM-DD. */
export function formatDayMonth(day: string): string {
  return dayMonth.format(parseDayKey(day))
}

export function formatTime(iso: string): string {
  return time.format(new Date(iso))
}

export function validityText(expiresOn: string | null, expired: boolean): string | null {
  if (!expiresOn) return null
  return expired
    ? `Venceu em ${formatDayMonth(expiresOn)}`
    : `Válido até ${formatDayMonth(expiresOn)}`
}

export const PRIVACY_TEXT =
  'Para usar o treino da academia, guardamos seu nome, seu celular e os treinos e cargas que você ' +
  'registrar nas fichas da academia e, se a academia fizer, suas avaliações físicas. Eles servem ' +
  'só para a sua academia acompanhar seu treino. ' +
  'As fichas que você cria sozinho continuam só no seu aparelho. Para apagar seus dados, peça à academia.'
