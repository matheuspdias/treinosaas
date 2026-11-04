import raw from '@/catalog/generated/exercises.json'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import type { CustomExercise } from '@/domain/types'
import { instantiateTemplate } from './instantiate'
import { TEMPLATES } from './templates'
import type { WorkoutTemplate } from './templates'

const catalogIds = new Set((raw as { id: string }[]).map((e) => e.id))

describe('modelos de treino', () => {
  it('existem os modelos pedidos', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['abc', 'abcd', 'fullbody', 'upperlower'])
  })

  it.each(TEMPLATES.map((t) => [t.name, t] as const))(
    '%s: exercícios existem (catálogo com nome pt-BR, ou personalizado do modelo)',
    (_, t) => {
      const customKeys = new Set((t.customExercises ?? []).map((c) => c.key))
      for (const key of customKeys) expect(catalogIds.has(key), key).toBe(false)
      for (const plan of t.plans) {
        for (const [id, sets, min, max, rest, extra] of plan.exercises) {
          if (!customKeys.has(id)) {
            expect(catalogIds.has(id), id).toBe(true)
            expect(EXERCISE_NAMES_PT_BR[id], id).toBeDefined()
          }
          expect(sets).toBeGreaterThan(0)
          expect(min).toBeLessThanOrEqual(max)
          expect(rest).toBeGreaterThan(0)
          expect((extra?.notes ?? '').length, id).toBeLessThanOrEqual(300)
        }
      }
    },
  )

  it('instancia fichas novas no fim da sequência, com carga zero', () => {
    let n = 0
    const { plans, customExercises } = instantiateTemplate(
      TEMPLATES[0]!,
      { startOrder: 5, defaults: { defaultIncrementKg: 2.5 } },
      () => `id${++n}`,
      'now',
    )
    expect(customExercises).toEqual([])
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

describe('exercícios fora do catálogo num modelo', () => {
  const template: WorkoutTemplate = {
    ...TEMPLATES[0]!,
    customExercises: [
      {
        key: 'burpee',
        name: 'Burpee',
        primaryMuscles: ['quadriceps'],
        secondaryMuscles: [],
        equipment: 'body only',
        instructions: '',
      },
    ],
    plans: [{ name: 'Casa', color: 'lime', focus: '', exercises: [['burpee', 3, 10, 15, 60]] }],
  }
  let n = 0
  const instantiate = (existingCustom?: CustomExercise[]) =>
    instantiateTemplate(
      template,
      { startOrder: 0, defaults: { defaultIncrementKg: 2.5 }, existingCustom },
      () => `id${++n}`,
      'now',
    )

  it('vira exercício personalizado e a ficha aponta para ele', () => {
    const { plans, customExercises } = instantiate()
    expect(customExercises.map((c) => c.name)).toEqual(['Burpee'])
    expect(plans[0]!.exercises[0]!.exercise).toEqual({
      source: 'custom',
      id: customExercises[0]!.id,
    })
  })

  it('reaproveita o personalizado que o usuário já tem com o mesmo nome', () => {
    const mine: CustomExercise = {
      id: 'meu-burpee',
      createdAt: 'x',
      updatedAt: 'x',
      name: 'burpee',
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: null,
      instructions: '',
    }
    const { plans, customExercises } = instantiate([mine])
    expect(customExercises).toEqual([])
    expect(plans[0]!.exercises[0]!.exercise).toEqual({ source: 'custom', id: 'meu-burpee' })
  })
})
