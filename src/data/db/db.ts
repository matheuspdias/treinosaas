import Dexie, { type Table } from 'dexie'
import type { CustomExercise, MediaBlob, Plan, Session } from '@/domain/types'
import { applyMigrations } from './migrations'

export interface SettingRow {
  key: string
  value: unknown
}

export class TreinoDB extends Dexie {
  plans!: Table<Plan, string>
  customExercises!: Table<CustomExercise, string>
  mediaBlobs!: Table<MediaBlob, string>
  sessions!: Table<Session, string>
  settings!: Table<SettingRow, string>

  constructor(name = 'treinoapp') {
    super(name)
    applyMigrations(this)
  }
}

export const db = new TreinoDB()
