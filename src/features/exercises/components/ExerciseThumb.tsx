import { Dumbbell } from 'lucide-react'
import { useState } from 'react'
import type { ExerciseRef } from '@/domain/types'
import { thumbnailUrl } from '@/media/registry'
import { useExerciseMedia } from '@/media/useExerciseMedia'
import { cn } from '@/ui/cn'

function Placeholder({ className }: { className?: string }) {
  return (
    <span
      className={cn('flex items-center justify-center bg-surface-2 text-fg-subtle', className)}
      aria-hidden
    >
      <Dumbbell className="size-1/2" />
    </span>
  )
}

function CustomThumb({ exRef, className }: { exRef: ExerciseRef; className?: string }) {
  const media = useExerciseMedia(exRef)
  if (media?.kind === 'image' || media?.kind === 'gif')
    return <img src={media.src} alt="" className={cn('bg-white object-cover', className)} />
  if (media?.kind === 'youtube')
    return (
      <img
        src={`https://i.ytimg.com/vi/${media.videoId}/mqdefault.jpg`}
        alt=""
        className={cn('object-cover', className)}
        loading="lazy"
      />
    )
  return <Placeholder className={className} />
}

/** Miniatura estática para listas. */
export function ExerciseThumb({ exRef, className }: { exRef: ExerciseRef; className?: string }) {
  const [failed, setFailed] = useState(false)
  const base = cn('size-14 shrink-0 overflow-hidden rounded-xl', className)
  if (exRef.source === 'custom') return <CustomThumb exRef={exRef} className={base} />
  const url = thumbnailUrl(exRef)
  if (!url || failed) return <Placeholder className={base} />
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(base, 'bg-white object-cover')}
    />
  )
}
