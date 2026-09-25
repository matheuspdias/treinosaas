import { plan } from '@/test/factories'
import { nextPlanInSequence, reindex } from './sequence'

describe('nextPlanInSequence', () => {
  const a = plan('A', 0)
  const b = plan('B', 1)
  const c = plan('C', 2)

  it('sem histórico sugere a primeira ficha', () => {
    expect(nextPlanInSequence([c, a, b], null)).toBe(a)
  })

  it('avança A → B → C → A', () => {
    expect(nextPlanInSequence([a, b, c], a.id)).toBe(b)
    expect(nextPlanInSequence([a, b, c], b.id)).toBe(c)
    expect(nextPlanInSequence([a, b, c], c.id)).toBe(a)
  })

  it('pula fichas arquivadas', () => {
    const bArchived = { ...b, archivedAt: '2026-01-01T00:00:00Z' }
    expect(nextPlanInSequence([a, bArchived, c], a.id)).toBe(c)
  })

  it('se a última ficha feita foi arquivada, continua da posição dela', () => {
    const bArchived = { ...b, archivedAt: '2026-01-01T00:00:00Z' }
    expect(nextPlanInSequence([a, bArchived, c], b.id)).toBe(c)
  })

  it('se a última ficha foi apagada, volta ao início', () => {
    expect(nextPlanInSequence([a, b, c], 'nao-existe')).toBe(a)
  })

  it('sem fichas ativas retorna null', () => {
    expect(nextPlanInSequence([{ ...a, archivedAt: 'x' }], null)).toBeNull()
  })

  it('reindex renumera a ordem', () => {
    expect(reindex([c, a, b]).map((p) => p.order)).toEqual([0, 1, 2])
  })
})
