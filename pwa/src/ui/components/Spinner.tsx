import { cn } from '../cn'

export function Spinner({
  className,
  label = 'Carregando',
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-6 animate-spin rounded-full border-[3px] border-surface-3 border-t-accent',
        className,
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
