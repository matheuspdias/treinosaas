/**
 * Gera o catálogo de exercícios embutido a partir do free-exercise-db (The Unlicense / domínio público).
 *
 * - Baixa exercises.json e as imagens do commit fixado abaixo (cache em .catalog-cache/).
 * - Converte cada imagem para WebP (largura máx. 480px) em public/exercises/<id>/{0,1}.webp.
 * - Escreve um JSON enxuto em src/catalog/generated/exercises.json.
 *
 * Uso: npm run catalog
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const COMMIT = 'a859101d633a01c4a1a920d6a8ce41dabba0705f'
const RAW = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}`
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.catalog-cache', COMMIT)
const OUT_IMAGES = join(ROOT, 'public', 'exercises')
const OUT_JSON = join(ROOT, 'src', 'catalog', 'generated', 'exercises.json')
const IMAGE_WIDTH = 480
const WEBP_QUALITY = 70
const CONCURRENCY = 12

interface SourceExercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function fetchCached(relPath: string): Promise<Buffer> {
  const cached = join(CACHE, relPath)
  if (await exists(cached)) return readFile(cached)
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${RAW}/${relPath.split('/').map(encodeURIComponent).join('/')}`)
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      await mkdir(dirname(cached), { recursive: true })
      await writeFile(cached, buf)
      return buf
    }
    if (attempt >= 3) throw new Error(`Falha ao baixar ${relPath}: HTTP ${res.status}`)
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const item = items[next++]!
        await worker(item)
      }
    }),
  )
}

async function main(): Promise<void> {
  const source = JSON.parse(
    (await fetchCached('dist/exercises.json')).toString('utf8'),
  ) as SourceExercise[]
  console.log(`${source.length} exercícios no dataset`)

  let done = 0
  let bytes = 0
  await runPool(source, async (ex) => {
    await Promise.all(
      ex.images.slice(0, 2).map(async (img, i) => {
        const out = join(OUT_IMAGES, ex.id, `${i}.webp`)
        if (!(await exists(out))) {
          const input = await fetchCached(`exercises/${img}`)
          await mkdir(dirname(out), { recursive: true })
          await sharp(input)
            .resize({ width: IMAGE_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY, effort: 5 })
            .toFile(out)
        }
        const size = (await readFile(out)).byteLength
        bytes += size
      }),
    )
    done++
    if (done % 100 === 0) console.log(`  ${done}/${source.length}`)
  })

  const slim = source.map((ex) => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    level: ex.level,
    mechanic: ex.mechanic,
    force: ex.force,
    equipment: ex.equipment,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    instructions: ex.instructions,
    imageCount: Math.min(ex.images.length, 2),
  }))
  await mkdir(dirname(OUT_JSON), { recursive: true })
  await writeFile(OUT_JSON, JSON.stringify(slim))
  console.log(`OK: ${slim.length} exercícios, imagens ${(bytes / 1024 / 1024).toFixed(1)} MB`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
