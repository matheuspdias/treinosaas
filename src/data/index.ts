import { db } from './db/db'
import { createDexieRepositories } from './repositories/dexie'

export type { Repositories } from './repositories/types'

/** Ponto único de acesso a dados do app. */
export const repos = createDexieRepositories(db)
