import type {
  AcademyFeed,
  AcademySession,
  BodyMetric,
  CustomExercise,
  ID,
  MediaBlob,
  Plan,
  Session,
  Settings,
} from '@/domain/types'
import type { OutboxItem } from '../sync/outbox'

/*
 * Contratos de acesso a dados. As telas dependem só destas interfaces;
 * a implementação atual é Dexie (IndexedDB). Uma futura sincronização com a nuvem
 * entra como outra implementação (ou decorator) sem mudar as telas.
 */

export interface PlanRepository {
  /** Todas as fichas não excluídas (inclui arquivadas), ordenadas por `order`. */
  list(): Promise<Plan[]>
  get(id: ID): Promise<Plan | undefined>
  save(plan: Plan): Promise<void>
  saveMany(plans: Plan[]): Promise<void>
  remove(id: ID): Promise<void>
}

export interface SessionRepository {
  get(id: ID): Promise<Session | undefined>
  getActive(): Promise<Session | undefined>
  /** Sessões concluídas, mais recentes primeiro. */
  listCompleted(): Promise<Session[]>
  save(session: Session): Promise<void>
  remove(id: ID): Promise<void>
}

export interface CustomExerciseRepository {
  list(): Promise<CustomExercise[]>
  get(id: ID): Promise<CustomExercise | undefined>
  save(exercise: CustomExercise): Promise<void>
  remove(id: ID): Promise<void>
}

export interface MediaRepository {
  get(id: ID): Promise<MediaBlob | undefined>
  put(blob: Blob, mimeType: string): Promise<ID>
  remove(id: ID): Promise<void>
}

export interface SettingsRepository {
  get(): Promise<Settings>
  update(patch: Partial<Settings>): Promise<void>
}

export interface BodyMetricRepository {
  /** Registros não excluídos, do mais antigo para o mais recente. */
  list(): Promise<BodyMetric[]>
  save(metric: BodyMetric): Promise<void>
  remove(id: ID): Promise<void>
}

export interface AcademyRepository {
  getSession(): Promise<AcademySession | undefined>
  saveSession(session: AcademySession): Promise<void>
  clearSession(): Promise<void>
  getFeed(): Promise<AcademyFeed>
  updateFeed(patch: Partial<AcademyFeed>): Promise<void>
}

export interface OutboxRepository {
  /** Itens na ordem em que entraram na fila. */
  list(): Promise<OutboxItem[]>
  put(item: OutboxItem): Promise<void>
  remove(ids: string[]): Promise<void>
  count(): Promise<number>
}

export interface Repositories {
  plans: PlanRepository
  sessions: SessionRepository
  customExercises: CustomExerciseRepository
  media: MediaRepository
  settings: SettingsRepository
  bodyMetrics: BodyMetricRepository
  academy: AcademyRepository
  outbox: OutboxRepository
}
