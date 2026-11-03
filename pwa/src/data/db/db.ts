import Dexie, { type Table } from 'dexie'
import type { BodyMetric, CustomExercise, MediaBlob, Plan, Session } from '@/domain/types'
import type { OutboxItem } from '../sync/outbox'
import { ACADEMY_SLUG } from '../remote/config'
import { applyMigrations } from './migrations'

export interface SettingRow {
  key: string
  value: unknown
}

/** Linha chave-valor da tabela `academy` (sessão e conteúdo da academia). */
export interface AcademyRow {
  key: string
  value: unknown
}

export class TreinoDB extends Dexie {
  plans!: Table<Plan, string>
  customExercises!: Table<CustomExercise, string>
  mediaBlobs!: Table<MediaBlob, string>
  sessions!: Table<Session, string>
  settings!: Table<SettingRow, string>
  bodyMetrics!: Table<BodyMetric, string>
  /** Fora do backup de propósito: o restore não desloga o aluno. */
  academy!: Table<AcademyRow, string>
  syncOutbox!: Table<OutboxItem, string>

  constructor(name = 'treinoapp') {
    super(name)
    applyMigrations(this)
  }
}

// Um banco por academia: o mesmo celular pode ter o app de duas academias instalado sem misturar dados.
export const db = new TreinoDB(ACADEMY_SLUG ? `treinoapp-${ACADEMY_SLUG}` : 'treinoapp')
