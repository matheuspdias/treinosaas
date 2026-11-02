import { ImageOff, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../cn'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

export interface AnimatedFramesProps {
  frames: string[]
  alt: string
  /** Tempo em cada quadro (ms). */
  interval?: number
  className?: string
}

/**
 * Alterna entre os quadros (início e fim do movimento) com transição suave, efeito "GIF".
 * Tocar pausa/retoma. Com prefers-reduced-motion começa parado. Pausa sozinho fora da tela.
 */
export function AnimatedFrames({ frames, alt, interval = 1100, className }: AnimatedFramesProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  const paused = userPaused ?? reducedMotion
  const animating = frames.length > 1 && !paused && visible && !failed

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!animating) return
    const t = setInterval(() => setIndex((i) => (i + 1) % frames.length), interval)
    return () => clearInterval(t)
  }, [animating, frames.length, interval])

  if (failed || frames.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center bg-surface-2 text-fg-subtle', className)}
        role="img"
        aria-label={`${alt} (sem imagem)`}
      >
        <ImageOff className="size-10" />
      </div>
    )
  }

  const canAnimate = frames.length > 1
  return (
    <button
      ref={ref}
      type="button"
      disabled={!canAnimate}
      aria-pressed={canAnimate ? paused : undefined}
      aria-label={
        canAnimate ? (paused ? `Reproduzir animação: ${alt}` : `Pausar animação: ${alt}`) : alt
      }
      onClick={() => setUserPaused(!paused)}
      className={cn('group relative block overflow-hidden bg-white', className)}
    >
      {frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ''}
          aria-hidden={i !== 0}
          draggable={false}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 size-full object-contain transition-opacity duration-500 ease-in-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      {canAnimate && (
        <span
          className={cn(
            'absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-black/55 text-white transition-opacity',
            paused ? 'opacity-100' : 'opacity-0 group-focus-visible:opacity-100',
          )}
          aria-hidden
        >
          {paused ? (
            <Play className="size-4 fill-current" />
          ) : (
            <Pause className="size-4 fill-current" />
          )}
        </span>
      )}
    </button>
  )
}
