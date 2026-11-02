import { CalendarX2, ChevronRight, Megaphone, Pin, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useAcademyFeed, useAcademySession } from '@/data/hooks'
import { markProgramSeen } from '@/data/sync'
import { activeAcademyPrograms } from '@/domain/academy'
import type { Plan, Session } from '@/domain/types'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { formatDayMonth } from './strings'

/** Avisos da academia no topo do Início: treino novo, ficha vencida e mural. */
export function AcademyHomeCards({
  plans,
  history,
}: {
  plans: readonly Plan[]
  history: readonly Session[]
}) {
  const session = useAcademySession()
  const feed = useAcademyFeed()
  const navigate = useNavigate()
  if (!session) return null

  const programs = activeAcademyPrograms(plans)
  const fresh = programs.find((p) => p.info.isNew)
  const expired = programs.find((p) => p.info.expired && p.info.expiresOn)
  const notices = feed.notices.slice(0, 2)
  const doneIds = new Set(history.map((s) => s.planId))

  const open = (programId: string, planId: string) => {
    void markProgramSeen(programId)
    navigate(`/fichas/${planId}`)
  }

  return (
    <div className="mb-6 space-y-3">
      {fresh && (
        <Card className="border-2 border-accent p-4">
          <p className="flex items-center gap-2 font-bold">
            <Sparkles className="size-5 text-accent" aria-hidden />
            {fresh.plans.some((p) => doneIds.has(p.id))
              ? 'Seu treino foi atualizado'
              : 'Seu instrutor tem um treino novo!'}
          </p>
          <p className="mt-1 text-fg-muted">
            {fresh.info.programName}
            {fresh.info.author && ` · por ${fresh.info.author}`}
          </p>
          <Button block className="mt-3" onClick={() => open(fresh.programId, fresh.plans[0]!.id)}>
            Ver treino
          </Button>
        </Card>
      )}

      {expired && (
        <Card className="flex gap-3 bg-warning-soft p-4">
          <CalendarX2 className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <p>
            Sua ficha venceu em {formatDayMonth(expired.info.expiresOn!)}. Fale com seu instrutor.
          </p>
        </Card>
      )}

      {notices.length > 0 && (
        <Card>
          <Link
            to="/academia/avisos"
            className="flex min-h-touch items-center gap-2 px-4 pt-3 pb-1 font-bold active:opacity-70"
          >
            <Megaphone className="size-5 text-accent" aria-hidden />
            <span className="flex-1">Mural da {session.academy.name}</span>
            <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
          </Link>
          <ul className="divide-y divide-border">
            {notices.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <p className="flex items-center gap-1.5 font-semibold">
                  {n.pinned && <Pin className="size-4 text-accent" aria-label="Fixado" />}
                  {n.title}
                </p>
                <p className="line-clamp-2 text-sm text-fg-muted">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
