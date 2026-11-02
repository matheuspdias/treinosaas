import { Megaphone, Pin } from 'lucide-react'
import { useAcademyFeed, useAcademySession } from '@/data/hooks'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

/** Mural de avisos da academia (guardado para ler offline). */
export function NoticesPage() {
  const session = useAcademySession()
  const { notices } = useAcademyFeed()

  return (
    <>
      <PageHeader back="/" title="Mural" subtitle={session?.academy.name} />
      {notices.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-8" />}
          title="Nenhum aviso"
          description="Os avisos da academia (horários, feriados, eventos) aparecem aqui."
        />
      ) : (
        <ul className="space-y-3 px-4 pb-8">
          {notices.map((n) => (
            <li key={n.id}>
              <Card className="p-4">
                <p className="flex items-center gap-1.5 text-lg font-bold">
                  {n.pinned && <Pin className="size-4 shrink-0 text-accent" aria-label="Fixado" />}
                  {n.title}
                </p>
                <p className="text-sm text-fg-subtle">{dateFmt.format(new Date(n.publishedAt))}</p>
                <p className="mt-2 whitespace-pre-line">{n.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
