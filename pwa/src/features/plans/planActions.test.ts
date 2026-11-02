// @vitest-environment node
import { repos } from '@/data'
import type { Plan } from '@/domain/types'
import { resetDatabase } from '@/test/resetDb'
import { plan, planExercise } from '@/test/factories'
import {
  addExercisesToPlan,
  archivePlan,
  createNextPlan,
  deletePlan,
  renamePlan,
  reorderActivePlans,
  updatePlanExercise,
} from './planActions'
import { planLetters } from './planLetters'

const academy = (name: string, order: number): Plan =>
  plan(name, order, {
    origin: 'academy',
    academy: {
      programId: 'prog',
      programName: 'Hipertrofia',
      author: null,
      expiresOn: null,
      expired: false,
      isNew: false,
      programNotes: null,
    },
    exercises: [planExercise('Barbell_Squat')],
  })

beforeEach(async () => {
  await resetDatabase()
})

describe('fichas da academia são só leitura', () => {
  it('nenhuma ação de edição altera a ficha da academia', async () => {
    const a = academy('Treino A', 0)
    await repos.plans.save(a)
    const exerciseId = a.exercises[0]!.id

    await renamePlan(a.id, 'Hackeado')
    await archivePlan(a.id, true)
    await addExercisesToPlan(a.id, [{ source: 'catalog', id: 'Dumbbell_Flyes' }])
    await updatePlanExercise(a.id, exerciseId, { loadKg: 999 })
    await deletePlan(a.id)

    expect(await repos.plans.get(a.id)).toEqual(a)
  })

  it('a sequência e as letras do usuário ignoram as fichas da academia', async () => {
    const own = plan('Treino A', 5)
    const acad = academy('Treino A', 0)
    await repos.plans.saveMany([own, acad])

    const created = await createNextPlan()
    expect(created.name).toBe('Treino B')

    await reorderActivePlans([created.id, own.id])
    expect((await repos.plans.get(acad.id))!.order).toBe(0)

    const letters = planLetters(await repos.plans.list())
    expect(letters.get(acad.id)).toBe('A')
    expect(letters.get(created.id)).toBe('A')
    expect(letters.get(own.id)).toBe('B')
  })

  it('sem academia, as letras continuam as de sempre', () => {
    const [x, y, z] = [plan('x', 1), plan('y', 0), plan('z', 2, { archivedAt: 'a' })]
    const letters = planLetters([x, y, z])
    expect([letters.get(x.id), letters.get(y.id), letters.get(z.id)]).toEqual(['B', 'A', '–'])
  })
})
