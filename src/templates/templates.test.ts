import raw from '@/catalog/generated/exercises.json'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import type { CustomExercise } from '@/domain/types'
import { instantiateTemplate } from './instantiate'
import { getTemplate, TEMPLATES } from './templates'

const catalogIds = new Set((raw as { id: string }[]).map((e) => e.id))

describe('modelos de treino', () => {
  it('existem os modelos pedidos', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      'abc',
      'abcd',
      'fullbody',
      'upperlower',
      'calistenia',
      'barra',
    ])
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

describe('modelo Calistenia Híbrido', () => {
  const template = getTemplate('calistenia')!
  let n = 0
  const newId = () => `id${++n}`
  const instantiate = (existingCustom?: CustomExercise[]) =>
    instantiateTemplate(
      template,
      { startOrder: 3, defaults: { defaultIncrementKg: 2.5 }, existingCustom },
      newId,
      'now',
    )

  it('cria as 5 fichas na ordem da semana, depois das existentes', () => {
    const { plans } = instantiate()
    expect(plans.map((p) => [p.name, p.order])).toEqual([
      ['Puxar · Academia', 3],
      ['Empurrar · Casa', 4],
      ['Pernas · Academia', 5],
      ['Puxar · Academia', 6],
      ['Empurrar + Abdômen · Casa', 7],
    ])
    expect(plans[3]!.exercises.map((e) => e.exercise)).toEqual(
      plans[0]!.exercises.map((e) => e.exercise),
    )
  })

  it('cria os exercícios fora do catálogo como personalizados e aponta as fichas para eles', () => {
    const { plans, customExercises } = instantiate()
    expect(customExercises.map((c) => c.name)).toEqual([
      'Dead hang (pendurar na barra)',
      'Pike push-up',
      'Burpee',
      'Polichinelo',
    ])
    const customIds = new Set(customExercises.map((c) => c.id))
    const refs = plans.flatMap((p) => p.exercises.map((e) => e.exercise))
    for (const ref of refs.filter((r) => r.source === 'custom')) {
      expect(customIds.has(ref.id)).toBe(true)
    }
    expect(refs.filter((r) => r.source === 'custom')).toHaveLength(6) // dead hang ×2, pike push-up ×2, burpee, polichinelo
  })

  it('reaproveita exercício personalizado que o usuário já tem com o mesmo nome', () => {
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
    expect(customExercises.map((c) => c.name)).not.toContain('Burpee')
    const sat = plans[4]!.exercises
    expect(sat.some((e) => e.exercise.source === 'custom' && e.exercise.id === 'meu-burpee')).toBe(
      true,
    )
  })

  it('incremento padrão só nos exercícios com carga; peso corporal fica com 0', () => {
    const { plans } = instantiate()
    const loaded = new Set([
      'Wide-Grip_Lat_Pulldown',
      'Barbell_Curl',
      'Barbell_Squat',
      'Stiff-Legged_Barbell_Deadlift',
      'Split_Squat_with_Dumbbells',
      'Standing_Calf_Raises',
    ])
    for (const e of plans.flatMap((p) => p.exercises)) {
      expect(e.incrementKg, e.exercise.id).toBe(loaded.has(e.exercise.id) ? 2.5 : 0)
      expect(e.loadKg).toBe(0)
    }
  })

  it('barra assistida progride reduzindo a assistência', () => {
    const { plans } = instantiate()
    const assisted = plans[0]!.exercises.find((e) => e.exercise.id === 'Band_Assisted_Pull-Up')!
    expect(assisted.incrementKg).toBe(0)
    expect(assisted.notes).toContain('Ao bater 8 reps em todas as séries, reduzir a assistência.')
  })
})

describe('modelo Foco na Barra Fixa', () => {
  const template = getTemplate('barra')!
  let n = 0
  const instantiate = (existingCustom?: CustomExercise[]) =>
    instantiateTemplate(
      template,
      { startOrder: 0, defaults: { defaultIncrementKg: 2.5 }, existingCustom },
      () => `id${++n}`,
      'now',
    )

  it('cria as 5 fichas na ordem dos dias', () => {
    expect(instantiate().plans.map((p) => p.name)).toEqual([
      'Puxar (foco barra)',
      'Empurrar',
      'Pernas + core',
      'Puxar 2',
      'Empurrar 2 + core',
    ])
  })

  it('reaproveita dead hang e pike push-up criados pelo modelo Calistenia Híbrido', () => {
    const fromCalistenia = instantiateTemplate(
      getTemplate('calistenia')!,
      { startOrder: 0, defaults: { defaultIncrementKg: 2.5 } },
      () => `c${++n}`,
      'now',
    ).customExercises
    const { customExercises } = instantiate(fromCalistenia)
    expect(customExercises.map((c) => c.name)).toEqual([
      'Isometria no topo da barra',
      'Hollow body (banana)',
    ])
  })

  it('incremento padrão só nos exercícios com carga; peso corporal e assistidos ficam com 0', () => {
    const bodyweight = new Set([
      'Scapular_Pull-Up',
      'Pullups',
      'Band_Assisted_Pull-Up',
      'Dips_-_Triceps_Version',
      'Pushups',
      'Hanging_Leg_Raise',
      'Inverted_Row',
      'Plank',
    ])
    for (const e of instantiate().plans.flatMap((p) => p.exercises)) {
      const zero = e.exercise.source === 'custom' || bodyweight.has(e.exercise.id)
      expect(e.incrementKg, e.exercise.id).toBe(zero ? 0 : 2.5)
    }
  })
})
