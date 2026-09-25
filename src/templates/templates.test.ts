import raw from '@/catalog/generated/exercises.json'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import { instantiateTemplate } from './instantiate'
import { TEMPLATES } from './templates'

const catalogIds = new Set((raw as { id: string }[]).map((e) => e.id))

describe('modelos de treino', () => {
  it('existem os quatro modelos pedidos', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['abc', 'abcd', 'fullbody', 'upperlower'])
  })

  it.each(TEMPLATES.map((t) => [t.name, t] as const))(
    '%s: exercícios existem no catálogo e têm nome em pt-BR',
    (_, t) => {
      for (const plan of t.plans) {
        for (const [id, sets, min, max, rest] of plan.exercises) {
          expect(catalogIds.has(id), id).toBe(true)
          expect(EXERCISE_NAMES_PT_BR[id], id).toBeDefined()
          expect(sets).toBeGreaterThan(0)
          expect(min).toBeLessThanOrEqual(max)
          expect(rest).toBeGreaterThan(0)
        }
      }
    },
  )

  it('instancia fichas novas no fim da sequência, com carga zero', () => {
    let n = 0
    const plans = instantiateTemplate(
      TEMPLATES[0]!,
      { startOrder: 5, defaults: { defaultIncrementKg: 2.5 } },
      () => `id${++n}`,
      'now',
    )
    expect(plans.map((p) => [p.name, p.order])).toEqual([
      ['Treino A', 5],
      ['Treino B', 6],
      ['Treino C', 7],
    ])
    expect(
      plans.flatMap((p) => p.exercises).every((e) => e.loadKg === 0 && e.incrementKg === 2.5),
    ).toBe(true)
    const ids = [...plans.map((p) => p.id), ...plans.flatMap((p) => p.exercises.map((e) => e.id))]
    expect(new Set(ids).size).toBe(ids.length)
  })
})
