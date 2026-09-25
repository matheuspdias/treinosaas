import { ImageOff, Play, WifiOff } from 'lucide-react'
import { useState } from 'react'
import type { ExerciseRef } from '@/domain/types'
import { useExerciseMedia } from '@/media/useExerciseMedia'
import { cn } from '@/ui/cn'
import { AnimatedFrames } from '@/ui/components/AnimatedFrames'
import { Spinner } from '@/ui/components/Spinner'

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <iframe
        className="absolute inset-0 size-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    )
  }
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      disabled={offline}
      className="absolute inset-0 flex items-center justify-center bg-black"
      aria-label={`Reproduzir vídeo: ${title}`}
    >
      {!offline && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-80"
        />
      )}
      {offline ? (
        <span className="relative flex flex-col items-center gap-2 px-6 text-center text-sm text-white">
          <WifiOff className="size-8" />
          Vídeo do YouTube precisa de internet
        </span>
      ) : (
        <span className="relative flex size-16 items-center justify-center rounded-full bg-black/70 text-white">
          <Play className="size-7 fill-current" />
        </span>
      )}
    </button>
  )
}

/** Mostra a mídia do exercício, qualquer que seja a origem. */
export function ExerciseMediaView({
  exRef,
  name,
  className,
}: {
  exRef: ExerciseRef
  name: string
  className?: string
}) {
  const media = useExerciseMedia(exRef)
  const box = cn(
    'relative aspect-[4/3] w-full overflow-hidden rounded-card bg-surface-2',
    className,
  )

  if (!media) {
    return (
      <div className={cn(box, 'flex items-center justify-center')}>
        <Spinner />
      </div>
    )
  }
  switch (media.kind) {
    case 'frames':
      return <AnimatedFrames frames={media.frames} alt={name} className={box} />
    case 'image':
    case 'gif':
      return (
        <div className={cn(box, 'bg-white')}>
          <img src={media.src} alt={name} className="absolute inset-0 size-full object-contain" />
        </div>
      )
    case 'video':
      return (
        <div className={cn(box, 'bg-black')}>
          <video
            src={media.src}
            className="absolute inset-0 size-full object-contain"
            autoPlay
            loop
            muted
            playsInline
            aria-label={name}
            onClick={(e) =>
              e.currentTarget.paused ? void e.currentTarget.play() : e.currentTarget.pause()
            }
          />
        </div>
      )
    case 'youtube':
      return (
        <div className={box}>
          <YouTubeEmbed videoId={media.videoId} title={name} />
        </div>
      )
    case 'none':
      return (
        <div
          className={cn(box, 'flex flex-col items-center justify-center gap-2 text-fg-subtle')}
          role="img"
          aria-label={`${name} (sem imagem)`}
        >
          <ImageOff className="size-10" />
          <span className="text-sm">Sem imagem</span>
        </div>
      )
  }
}
