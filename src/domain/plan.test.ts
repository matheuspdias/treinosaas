import { plan, planExercise } from '@/test/factories'
import { createPlan, duplicatePlan, moveItem, sanitizeTarget } from './plan'

describe('plan', () => {
  it('cria ficha com cor pela posição e nome sem espaços', () => {
    const p = createPlan({ name: '  Treino A ', order: 1 }, () => 'x', 'now')
    expect(p).toMatchObject({ id: 'x', name: 'Treino A', color: 'emerald', exercises: [] })
  })

  it('duplica com novos ids e sem arquivamento', () => {
    let i = 0
    const original = plan('A', 0, { archivedAt: 'x', exercises: [planExercise('bench')] })
    const copy = duplicatePlan(original, 5, () => `new${++i}`, 'now')
    expect(copy.id).not.toBe(original.id)
    expect(copy.exercises[0]?.id).not.toBe(original.exercises[0]?.id)
    expect(copy.exercises[0]?.exercise).toEqual(original.exercises[0]?.exercise)
    expect(copy).toMatchObject({ name: 'A (cópia)', order: 5 })
    expect(copy.archivedAt).toBeUndefined()
  })

  it('move itens', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('limita valores', () => {
    expect(sanitizeTarget({ sets: 0, repMax: 500, restSec: -1, loadKg: 2.5 })).toEqual({
      sets: 1,
      repMax: 100,
      restSec: 0,
      loadKg: 2.5,
    })
  })
})
