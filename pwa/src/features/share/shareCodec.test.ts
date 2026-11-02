// @vitest-environment node
import { plan, planExercise } from '@/test/factories'
import type { CustomExercise } from '@/domain/types'
import { decodeSharedPlan, encodeSharedPlan, shareUrl, toSharedPlan } from './shareCodec'

const b64url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const custom: CustomExercise = {
  id: 'c1',
  createdAt: 'x',
  updatedAt: 'x',
  name: 'Remada na máquina X',
  primaryMuscles: ['lats'],
  secondaryMuscles: [],
  equipment: 'machine',
  instructions: 'Peito apoiado',
  media: { kind: 'youtube', videoId: 'dQw4w9WgXcQ' },
}
const p = plan('Treino A – peito', 0, {
  color: 'violet',
  exercises: [
    planExercise('Barbell_Bench_Press_-_Medium_Grip', {
      loadKg: 62.5,
      notes: 'banco na posição 4',
    }),
    { ...planExercise('x'), exercise: { source: 'custom', id: 'c1' }, loadKg: 40 },
  ],
})

describe('compartilhar ficha por link', () => {
  it('ida e volta preserva a ficha', async () => {
    const shared = toSharedPlan(p, [custom], { includeLoads: true })
    const code = await encodeSharedPlan(shared)
    expect(code[0]).toBe('z')
    expect(code).toMatch(/^[\w-]+$/) // seguro para URL
    const back = await decodeSharedPlan(code)
    expect(back).toEqual({ ok: true, plan: shared })
  })

  it('sem cargas por padrão de privacidade quando includeLoads = false', () => {
    const shared = toSharedPlan(p, [custom], { includeLoads: false })
    expect(shared.e.map((e) => e[5])).toEqual([0, 0])
  })

  it('leva só os exercícios personalizados usados, sem mídia própria (só YouTube)', () => {
    const other = { ...custom, id: 'c2', name: 'Não usado' }
    const shared = toSharedPlan(p, [custom, other], { includeLoads: false })
    expect(shared.x).toEqual([
      {
        i: 'c1',
        n: 'Remada na máquina X',
        m: ['lats'],
        q: 'machine',
        t: 'Peito apoiado',
        y: 'dQw4w9WgXcQ',
      },
    ])
  })

  it('link curto o bastante para QR code', async () => {
    const big = plan('ABC', 0, {
      exercises: Array.from({ length: 10 }, (_, i) => planExercise(`Exercise_Number_${i}`)),
    })
    const url = shareUrl(
      await encodeSharedPlan(toSharedPlan(big, [], { includeLoads: true })),
      'https://treinoapp.vercel.app',
    )
    expect(url.length).toBeLessThan(600)
  })

  it('rejeita códigos inválidos ou adulterados', async () => {
    expect((await decodeSharedPlan('')).ok).toBe(false)
    expect((await decodeSharedPlan('zlixo!!')).ok).toBe(false)
    expect((await decodeSharedPlan('qabc')).ok).toBe(false)
    const evil =
      'j' +
      b64url(
        JSON.stringify({ v: 1, n: 'x', c: 'lime', e: [['catalog', 'a', 999, 1, 1, 0, 0, 0, '']] }),
      )
    expect((await decodeSharedPlan(evil)).ok).toBe(false)
  })

  it('aceita o formato sem compressão', async () => {
    const shared = toSharedPlan(p, [], { includeLoads: false })
    const code = 'j' + b64url(JSON.stringify(shared))
    expect(await decodeSharedPlan(code)).toMatchObject({ ok: true })
  })
})
