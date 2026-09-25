import { session, sessionExercise, set } from '@/test/factories'
import { computeBests, detectBrokenRecords, mergeBests, setRecordTypes } from './records'

describe('records', () => {
  const old = session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(80, 8), set(85, 5)])])

  it('calcula melhores marcas por exercício', () => {
    const bests = computeBests([old]).get('catalog:bench')!
    expect(bests.weight).toBe(85)
    expect(bests.setVolume).toBe(640)
    // 80×8 (101,3) supera 85×5 (99,2) no 1RM estimado
    expect(bests.e1rm).toBeCloseTo(80 * (1 + 8 / 30), 6)
  })

  it('detecta recordes de carga, 1RM e volume separadamente', () => {
    const now = session('2026-01-08T10:00:00Z', [sessionExercise('bench', [set(80, 10)])])
    const broken = detectBrokenRecords(now, [old])
    expect(broken.map((b) => b.type).sort()).toEqual(['e1rm', 'setVolume'])
    const vol = broken.find((b) => b.type === 'setVolume')!
    expect(vol.value).toBe(800)
    expect(vol.previous).toBe(640)
  })

  it('igualar a marca não é recorde', () => {
    const now = session('2026-01-08T10:00:00Z', [sessionExercise('bench', [set(85, 5)])])
    expect(detectBrokenRecords(now, [old])).toEqual([])
  })

  it('primeira vez fazendo o exercício não gera recorde', () => {
    const now = session('2026-01-08T10:00:00Z', [sessionExercise('squat', [set(100, 5)])])
    expect(detectBrokenRecords(now, [old])).toEqual([])
  })

  it('aquecimento não conta para recorde', () => {
    const now = session('2026-01-08T10:00:00Z', [
      sessionExercise('bench', [set(100, 5, { isWarmup: true }), set(80, 5)]),
    ])
    expect(detectBrokenRecords(now, [old])).toEqual([])
  })

  it('ignora a própria sessão se ela estiver no histórico', () => {
    const now = session('2026-01-08T10:00:00Z', [sessionExercise('bench', [set(90, 5)])])
    expect(detectBrokenRecords(now, [old, now]).map((b) => b.type)).toContain('weight')
  })
})

describe('setRecordTypes', () => {
  const prev = { weight: 80, e1rm: 100, setVolume: 800 }
  it('detecta cada tipo de recorde da série', () => {
    expect(setRecordTypes(set(85, 1), prev)).toEqual(['weight'])
    expect(setRecordTypes(set(80, 10), prev)).toEqual(['e1rm'])
    expect(setRecordTypes(set(70, 12), prev)).toEqual(['setVolume'])
    expect(setRecordTypes(set(90, 10), prev)).toEqual(['weight', 'e1rm', 'setVolume'])
  })
  it('sem histórico, aquecimento ou série não concluída não são recorde', () => {
    expect(setRecordTypes(set(200, 10), undefined)).toEqual([])
    expect(setRecordTypes(set(200, 10, { isWarmup: true }), prev)).toEqual([])
    expect(setRecordTypes(set(200, 10, { completedAt: undefined }), prev)).toEqual([])
  })
  it('mergeBests pega o maior de cada marca', () => {
    expect(mergeBests(prev, { weight: 90, e1rm: 95, setVolume: 900 })).toEqual({
      weight: 90,
      e1rm: 100,
      setVolume: 900,
    })
    expect(mergeBests(undefined, prev)).toBe(prev)
  })
})
