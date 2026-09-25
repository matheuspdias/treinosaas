import { cn } from './cn'

describe('cn', () => {
  it('a última classe conflitante vence', () => {
    expect(cn('px-4 bg-surface-2 border-border', 'px-1 bg-transparent border-transparent')).toBe(
      'px-1 bg-transparent border-transparent',
    )
  })
  it('entende os tokens próprios', () => {
    expect(cn('min-h-touch rounded-control', 'min-h-11 rounded-full')).toBe('min-h-11 rounded-full')
    expect(cn('size-touch', 'size-11')).toBe('size-11')
    expect(cn('text-fg text-lg', 'text-accent')).toBe('text-lg text-accent')
  })
  it('ignora valores falsos', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})
