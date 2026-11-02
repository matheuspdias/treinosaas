import raw from './generated/exercises.json'
import { buildCatalog } from './catalog'
import { EXERCISE_NAMES_PT_BR } from './i18n/pt-BR'
import { searchExercises, EMPTY_FILTERS } from './search'
import type { RawCatalogExercise } from './types'

const catalog = buildCatalog(raw as RawCatalogExercise[])
const search = (query: string, extra: Partial<typeof EMPTY_FILTERS> = {}) =>
  searchExercises(catalog, { ...EMPTY_FILTERS, query, ...extra })

describe('catálogo', () => {
  it('todas as traduções apontam para exercícios existentes', () => {
    const ids = new Set(catalog.map((e) => e.ref.id))
    const missing = Object.keys(EXERCISE_NAMES_PT_BR).filter((id) => !ids.has(id))
    expect(missing).toEqual([])
  })

  it('tem pelo menos 150 exercícios com nome em pt-BR', () => {
    expect(catalog.filter((e) => e.popular).length).toBeGreaterThanOrEqual(150)
  })

  it('não há nomes pt-BR duplicados', () => {
    const names = Object.values(EXERCISE_NAMES_PT_BR).map((t) => t.name.toLowerCase())
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
  })
})

describe('searchExercises', () => {
  it('busca em português ignorando acentos', () => {
    expect(search('triceps frances')[0]?.name).toMatch(/Tríceps francês/)
    expect(search('elevacao lateral')[0]?.name).toBe('Elevação lateral com halteres')
  })

  it('busca em inglês', () => {
    expect(
      search('bench press').some((e) => e.ref.id === 'Barbell_Bench_Press_-_Medium_Grip'),
    ).toBe(true)
  })

  it('busca por sinônimos', () => {
    expect(search('serrote')[0]?.ref.id).toBe('One-Arm_Dumbbell_Row')
    expect(search('peck deck')[0]?.ref.id).toBe('Butterfly')
  })

  it('prioriza nome que começa com o termo', () => {
    expect(search('supino')[0]?.name.startsWith('Supino')).toBe(true)
    expect(search('agachamento')[0]?.name.startsWith('Agachamento')).toBe(true)
  })

  it('exige todas as palavras', () => {
    expect(
      search('supino inclinado halteres').every(
        (e) => /inclinad/i.test(e.name) || /incline/i.test(e.nameEn ?? ''),
      ),
    ).toBe(true)
  })

  it('filtra por grupo muscular e equipamento', () => {
    const r = search('', { muscle: 'chest', equipment: 'dumbbell' })
    expect(r.length).toBeGreaterThan(5)
    expect(r.every((e) => e.primaryMuscles.includes('chest') && e.equipment === 'dumbbell')).toBe(
      true,
    )
  })

  it('sem busca, populares vêm primeiro', () => {
    const r = search('')
    const firstNonPopular = r.findIndex((e) => !e.popular)
    expect(r.slice(firstNonPopular).some((e) => e.popular)).toBe(false)
  })
})
