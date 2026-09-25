import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SETTINGS } from '@/domain/types'
import type { BodyMetric, CustomExercise, ID, Plan, Session, Settings } from '@/domain/types'
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

/** Preferências (com valores padrão enquanto carrega). */
export function useSettings(): Settings {
  return useLiveQuery(() => repos.settings.get(), []) ?? DEFAULT_SETTINGS
}

export function useBodyMetrics(): BodyMetric[] | undefined {
  return useLiveQuery(() => repos.bodyMetrics.list(), [])
}
