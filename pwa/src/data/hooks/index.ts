import { useLiveQuery } from 'dexie-react-hooks'
import { useSyncExternalStore } from 'react'
import { DEFAULT_SETTINGS, EMPTY_ACADEMY_FEED } from '@/domain/types'
import type {
  AcademyFeed,
  AcademySession,
  BodyMetric,
  CustomExercise,
  ID,
  Plan,
  Session,
  Settings,
} from '@/domain/types'
import { getBrandingState, subscribeBranding } from '../branding'
import type { BrandingState } from '../branding'
import { repos } from '../index'

/*
 * Hooks reativos: re-renderizam sozinhos quando os dados mudam no IndexedDB.
 * Retornam `undefined` enquanto carregam.
 */

export function usePlans(): Plan[] | undefined {
  return useLiveQuery(() => repos.plans.list(), [])
}

export function usePlan(id: ID | undefined): Plan | null | undefined {
  return useLiveQuery(async () => (id ? ((await repos.plans.get(id)) ?? null) : null), [id])
}

export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => (await repos.sessions.getActive()) ?? null, [])
}

export function useCompletedSessions(): Session[] | undefined {
  return useLiveQuery(() => repos.sessions.listCompleted(), [])
}

export function useSession(id: ID | undefined): Session | null | undefined {
  return useLiveQuery(async () => (id ? ((await repos.sessions.get(id)) ?? null) : null), [id])
}

export function useCustomExercises(): CustomExercise[] | undefined {
  return useLiveQuery(() => repos.customExercises.list(), [])
}

export function useCustomExercise(id: ID | undefined): CustomExercise | null | undefined {
  return useLiveQuery(
    async () => (id ? ((await repos.customExercises.get(id)) ?? null) : null),
    [id],
  )
}

/** Preferências; `undefined` enquanto carrega (use quando o valor padrão enganaria, ex.: onboarding). */
export function useSettingsState(): Settings | undefined {
  return useLiveQuery(() => repos.settings.get(), [])
}

/** Preferências (com valores padrão enquanto carrega). */
export function useSettings(): Settings {
  return useLiveQuery(() => repos.settings.get(), []) ?? DEFAULT_SETTINGS
}

export function useBodyMetrics(): BodyMetric[] | undefined {
  return useLiveQuery(() => repos.bodyMetrics.list(), [])
}

/** Aluno logado na academia; `null` fora do modo academia, `undefined` enquanto carrega. */
export function useAcademySession(): AcademySession | null | undefined {
  return useLiveQuery(async () => (await repos.academy.getSession()) ?? null, [])
}

export function useAcademyFeed(): AcademyFeed {
  return useLiveQuery(() => repos.academy.getFeed(), []) ?? EMPTY_ACADEMY_FEED
}

/** Igual a useAcademyFeed, mas `undefined` enquanto carrega (para decidir o acesso sem piscar). */
export function useAcademyFeedState(): AcademyFeed | undefined {
  return useLiveQuery(() => repos.academy.getFeed(), [])
}

/** Treinos e marcações esperando internet para ir para a academia. */
export function useOutboxCount(): number {
  return useLiveQuery(() => repos.outbox.count(), []) ?? 0
}

/** Marca da academia do app aberto (nome, cor, ícone). */
export function useBranding(): BrandingState {
  return useSyncExternalStore(subscribeBranding, getBrandingState)
}
