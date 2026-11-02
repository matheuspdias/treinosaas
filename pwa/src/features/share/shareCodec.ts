import { z } from 'zod'
import { EQUIPMENT, MUSCLES, PLAN_COLORS } from '@/domain/types'
import type { CustomExercise, Plan } from '@/domain/types'

/*
 * Ficha compartilhável por link, sem backend: JSON compacto → deflate → base64url,
 * no fragmento da URL (#...), que não é enviado ao servidor.
 * Prefixo do código: "z" = comprimido, "j" = JSON puro (navegador sem CompressionStream).
 */

const exerciseTuple = z.tuple([
  z.enum(['catalog', 'custom']),
  z.string().min(1).max(120),
  z.number().int().min(1).max(20), // séries
  z.number().int().min(1).max(100), // reps mín.
  z.number().int().min(1).max(100), // reps máx.
  z.number().min(0).max(1000), // carga kg
  z.number().int().min(0).max(600), // descanso s
  z.number().min(0).max(50), // incremento kg
  z.string().max(300), // observações
])

const sharedCustom = z.object({
  i: z.string().min(1).max(120),
  n: z.string().min(1).max(60),
  m: z.array(z.enum(MUSCLES)).max(17),
  q: z.enum(EQUIPMENT).nullable(),
  t: z.string().max(1000),
  y: z
    .string()
    .regex(/^[\w-]{11}$/)
    .optional(),
})

export const sharedPlanSchema = z.object({
  v: z.literal(1),
  n: z.string().min(1).max(60),
  c: z.enum(PLAN_COLORS),
  e: z.array(exerciseTuple).max(60),
  x: z.array(sharedCustom).max(60).optional(),
})

export type SharedPlan = z.infer<typeof sharedPlanSchema>

export function toSharedPlan(
  plan: Plan,
  customs: readonly CustomExercise[],
  opts: { includeLoads: boolean },
): SharedPlan {
  const usedCustom = new Set(
    plan.exercises.filter((e) => e.exercise.source === 'custom').map((e) => e.exercise.id),
  )
  const x = customs
    .filter((c) => usedCustom.has(c.id))
    .map((c) => ({
      i: c.id,
      n: c.name,
      m: c.primaryMuscles,
      q: c.equipment,
      t: c.instructions,
      ...(c.media?.kind === 'youtube' ? { y: c.media.videoId } : {}),
    }))
  return {
    v: 1,
    n: plan.name,
    c: plan.color,
    e: plan.exercises
      .filter((e) => e.exercise.source !== 'exercisedb')
      .map((e) => [
        e.exercise.source as 'catalog' | 'custom',
        e.exercise.id,
        e.sets,
        e.repMin,
        e.repMax,
        opts.includeLoads ? e.loadKg : 0,
        e.restSec,
        e.incrementKg,
        e.notes,
      ]),
    ...(x.length ? { x } : {}),
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)
  const bin = atob(b64)
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
}

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

const hasCompression = () =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'

export async function encodeSharedPlan(shared: SharedPlan): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(shared))
  if (!hasCompression()) return 'j' + toBase64Url(json)
  return 'z' + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export type DecodeResult = { ok: true; plan: SharedPlan } | { ok: false; error: string }

export async function decodeSharedPlan(code: string): Promise<DecodeResult> {
  const invalid: DecodeResult = {
    ok: false,
    error: 'Este link de ficha está incompleto ou corrompido.',
  }
  if (code.length < 2 || code.length > 20_000) return invalid
  try {
    const kind = code[0]
    let bytes = fromBase64Url(code.slice(1))
    if (kind === 'z') {
      if (!hasCompression())
        return { ok: false, error: 'Atualize o navegador para abrir este link.' }
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
    } else if (kind !== 'j') return invalid
    const parsed = sharedPlanSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)))
    return parsed.success ? { ok: true, plan: parsed.data } : invalid
  } catch {
    return invalid
  }
}

export function shareUrl(code: string, origin: string = location.origin): string {
  return `${origin}/importar#${code}`
}
