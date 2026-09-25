import { act, fireEvent, render, screen } from '@testing-library/react'
import { AnimatedFrames } from './AnimatedFrames'

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

const visibleFrame = () =>
  Array.from(document.querySelectorAll('img')).findIndex((img) =>
    img.className.includes('opacity-100'),
  )

describe('AnimatedFrames', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('alterna entre os quadros e pausa ao tocar', () => {
    mockMatchMedia(false)
    render(<AnimatedFrames frames={['/a.webp', '/b.webp']} alt="Supino" interval={1000} />)
    expect(visibleFrame()).toBe(0)
    act(() => void vi.advanceTimersByTime(1000))
    expect(visibleFrame()).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: /Pausar animação/ }))
    act(() => void vi.advanceTimersByTime(3000))
    expect(visibleFrame()).toBe(1)
    expect(screen.getByRole('button', { name: /Reproduzir animação/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('com movimento reduzido começa parado', () => {
    mockMatchMedia(true)
    render(<AnimatedFrames frames={['/a.webp', '/b.webp']} alt="Supino" interval={1000} />)
    act(() => void vi.advanceTimersByTime(3000))
    expect(visibleFrame()).toBe(0)
    expect(screen.getByRole('button', { name: /Reproduzir animação/ })).toBeInTheDocument()
  })
})
