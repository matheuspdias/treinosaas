import type { TreinoDB } from '../db/db'
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, backupSchema } from './schema'
import type { BackupFile } from './schema'

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function createBackup(db: TreinoDB, now = new Date()): Promise<BackupFile> {
  const [plans, sessions, customExercises, blobs, settingsRow, bodyMetrics] = await Promise.all([
    db.plans.toArray(),
    db.sessions.toArray(),
    db.customExercises.toArray(),
    db.mediaBlobs.toArray(),
    db.settings.get('app'),
    db.bodyMetrics.toArray(),
  ])
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    data: {
      // Fichas da academia não entram: são do servidor e voltam sozinhas na próxima sincronização
      // (restaurar não pode transformá-las em fichas editáveis do usuário).
      plans: plans.filter((p) => p.origin !== 'academy'),
      sessions,
      customExercises,
      mediaBlobs: await Promise.all(
        blobs.map(async (b) => ({
          id: b.id,
          mimeType: b.mimeType,
          createdAt: b.createdAt,
          dataBase64: await blobToBase64(b.blob),
        })),
      ),
      bodyMetrics,
      settings: (settingsRow?.value as BackupFile['data']['settings'] | undefined) ?? {},
    },
  }
}

type RawBackup = { formatVersion?: unknown; data?: Record<string, unknown> }

/** v1 → v2: surgiram os registros de peso e medidas. */
function migrateV1toV2(raw: RawBackup): RawBackup {
  return { ...raw, formatVersion: 2, data: { ...raw.data, bodyMetrics: [] } }
}

/** Converte backups de formatos antigos para o atual, um passo por versão. */
export function migrateBackup(raw: unknown): unknown {
  let current = raw as RawBackup
  if (current.formatVersion === 1) current = migrateV1toV2(current)
  return current
}

export type ParseBackupResult =
  { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: string }

export interface BackupSummary {
  plans: number
  sessions: number
  customExercises: number
  exportedAt: string
}

export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' }
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== BACKUP_APP_ID) {
    return { ok: false, error: 'Este arquivo não é um backup do TreinoBox.' }
  }
  const version = (raw as { formatVersion?: unknown }).formatVersion
  if (typeof version === 'number' && version > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error:
        'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.',
    }
  }
  const parsed = backupSchema.safeParse(migrateBackup(raw))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue?.path.join('.') ?? ''
    return { ok: false, error: `Backup inválido ou corrompido${where ? ` (campo ${where})` : ''}.` }
  }
  const { data } = parsed.data
  return {
    ok: true,
    backup: parsed.data,
    summary: {
      plans: data.plans.filter((p) => !p.deletedAt).length,
      sessions: data.sessions.filter((s) => s.status === 'completed').length,
      customExercises: data.customExercises.filter((e) => !e.deletedAt).length,
      exportedAt: parsed.data.exportedAt,
    },
  }
}

/** Substitui TODOS os dados locais pelo conteúdo do backup, numa única transação. */
export async function restoreBackup(db: TreinoDB, backup: BackupFile): Promise<void> {
  const { data } = backup
  await db.transaction(
    'rw',
    [db.plans, db.sessions, db.customExercises, db.mediaBlobs, db.settings, db.bodyMetrics],
    async () => {
      await Promise.all([
        db.plans.clear(),
        db.sessions.clear(),
        db.customExercises.clear(),
        db.mediaBlobs.clear(),
        db.settings.clear(),
        db.bodyMetrics.clear(),
      ])
      await db.plans.bulkPut(data.plans)
      await db.sessions.bulkPut(data.sessions)
      await db.customExercises.bulkPut(data.customExercises)
      await db.mediaBlobs.bulkPut(
        data.mediaBlobs.map((b) => ({
          id: b.id,
          mimeType: b.mimeType,
          createdAt: b.createdAt,
          blob: base64ToBlob(b.dataBase64, b.mimeType),
        })),
      )
      await db.bodyMetrics.bulkPut(data.bodyMetrics)
      await db.settings.put({ key: 'app', value: data.settings })
    },
  )
}
