import { cn } from '../cn'

/** Iniciais do nome (sem foto: menos dado pessoal guardado). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-fg',
        className,
      )}
    >
      {initials || '?'}
    </span>
  )
}
