import { parseAcademySlug } from '@/domain/academy'

/** URL da API da academia (ex.: https://api.exemplo.com/api). O app só funciona com ela. */
export const API_URL: string | null = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || null

/** Academia do app aberto: cada academia tem o seu em /{slug}/ (nome, ícone e dados próprios). */
export const ACADEMY_SLUG: string | null =
  typeof location === 'undefined' ? null : parseAcademySlug(location.pathname)

/** Prefixo das rotas do app ('' fora de uma academia). */
export const APP_BASE = ACADEMY_SLUG ? `/${ACADEMY_SLUG}` : ''

/** Política de privacidade, no site do painel (mesmo servidor da API). */
export const PRIVACY_URL: string | null = API_URL
  ? `${API_URL.replace(/\/api$/, '')}/privacidade`
  : null
