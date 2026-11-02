import { ChevronRight, Timer } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useActiveSession } from '@/data/hooks'
import { useElapsed } from '@/features/workout/useElapsed'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'
import { cn } from '@/ui/cn'

/** Faixa "treino em andamento" acima da navegação, em qualquer tela. */
export function ActiveWorkoutBar() {
  const session = useActiveSession()
  const elapsed = useElapsed(session?.startedAt)
  const { pathname } = useLocation()
  // Na tela inicial o card de "continuar treino" já cumpre esse papel.
  if (!session || pathname === '/') return null
  return (
    <Link
      to="/treino"
      className="mx-3 mb-2 flex min-h-14 items-center gap-3 rounded-card bg-accent px-4 text-accent-fg shadow-sheet active:brightness-95"
    >
      <span
        className={cn(
          'size-3 shrink-0 animate-pulse rounded-full ring-2 ring-accent-fg/40',
          PLAN_COLOR_CLASS[session.planColor].bg,
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold opacity-80">Treino em andamento</span>
        <span className="block truncate font-bold">{session.planName}</span>
      </span>
      <span className="flex items-center gap-1 font-bold tabular">
        <Timer className="size-4" aria-hidden />
        {elapsed}
      </span>
      <ChevronRight className="size-5" aria-hidden />
    </Link>
  )
}
