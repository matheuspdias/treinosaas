import { Link, router } from '@inertiajs/react'
import { Archive, ClipboardList, Copy, Eye, EyeOff, FilePlus2, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { formatDate, validityLabel } from '@/lib/format'
import { Badge } from '@/ui/components/Badge'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { ConfirmSheet } from '@/ui/components/ConfirmSheet'
import { IconButton } from '@/ui/components/IconButton'
import { Sheet } from '@/ui/components/Sheet'
import type { StudentProgram } from './types'

export function ProgramsCard({
  studentId,
  programs,
  templates,
  canManage,
}: {
  studentId: string
  programs: StudentProgram[]
  templates: { id: string; name: string }[]
  canManage: boolean
}) {
  const [picking, setPicking] = useState(false)
  const [archiving, setArchiving] = useState<StudentProgram | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const active = programs.filter((p) => !p.archived)
  const archived = programs.filter((p) => p.archived)

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-accent" />
          <h2 className="font-bold">Treinos</h2>
        </div>
        {canManage && (
          <Button size="md" icon={<Plus className="size-5" />} onClick={() => setPicking(true)}>
            Novo treino
          </Button>
        )}
      </div>

      {active.length === 0 ? (
        <p className="rounded-control bg-warning-soft p-4 text-warning">
          Sem treino ativo. O aluno só vê as fichas que ele mesmo criou no app.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((p) => (
            <ProgramRow
              key={p.id}
              program={p}
              canManage={canManage}
              onArchive={() => setArchiving(p)}
            />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="mt-3 min-h-11 text-sm font-semibold text-fg-muted"
          >
            {showArchived ? 'Esconder' : 'Ver'} treinos anteriores ({archived.length})
          </button>
          {showArchived && (
            <ul className="mt-1 flex flex-col gap-2 opacity-80">
              {archived.map((p) => (
                <ProgramRow key={p.id} program={p} canManage={canManage} />
              ))}
            </ul>
          )}
        </>
      )}

      <Sheet
        open={picking}
        onClose={() => setPicking(false)}
        title="Novo treino"
        description="O treino atual vai para os anteriores."
      >
        <div className="flex flex-col gap-2">
          <Link
            href={`/alunos/${studentId}/treinos/novo`}
            className={buttonClass({ variant: 'primary', block: true })}
          >
            <FilePlus2 className="size-5" /> Montar do zero
          </Link>
          {templates.length > 0 && (
            <>
              <p className="mt-3 text-sm font-semibold text-fg-muted">
                Ou partir de um modelo da academia
              </p>
              <ul className="flex flex-col gap-1">
                {templates.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/alunos/${studentId}/treinos/novo?modelo=${t.id}`}
                      className="flex min-h-touch items-center gap-3 rounded-control bg-surface-2 px-4 font-semibold active:bg-surface-3"
                    >
                      <Copy className="size-4 text-fg-muted" /> {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Sheet>

      <ConfirmSheet
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        title="Encerrar este treino?"
        description="Ele sai do app do aluno na próxima sincronização. O histórico de cargas continua aqui."
        confirmLabel="Encerrar treino"
        danger
        onConfirm={() =>
          archiving &&
          router.post(
            `/treinos/${archiving.id}/arquivar`,
            {},
            { preserveScroll: true, onFinish: () => setArchiving(null) },
          )
        }
      />
    </Card>
  )
}

function ProgramRow({
  program: p,
  canManage,
  onArchive,
}: {
  program: StudentProgram
  canManage: boolean
  onArchive?: () => void
}) {
  return (
    <li className="flex items-center gap-3 rounded-control bg-surface-2 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p.name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge>
            {p.plansCount} {p.plansCount === 1 ? 'ficha' : 'fichas'}
          </Badge>
          {p.expiresOn && !p.archived && (
            <Badge tone={p.expired ? 'danger' : 'neutral'}>{validityLabel(p.expiresOn)}</Badge>
          )}
          {!p.archived &&
            (p.seen ? (
              <Badge tone="success" icon={<Eye className="size-3.5" />}>
                Aluno já viu
              </Badge>
            ) : (
              <Badge tone="accent" icon={<EyeOff className="size-3.5" />}>
                Aluno ainda não viu
              </Badge>
            ))}
          {p.archived && <Badge>Desde {formatDate(p.createdAt)}</Badge>}
        </div>
      </div>
      {canManage && (
        <div className="flex shrink-0">
          {!p.archived && (
            <Link
              href={`/treinos/${p.id}/editar`}
              aria-label={`Editar ${p.name}`}
              title="Editar"
              className="inline-flex size-touch items-center justify-center rounded-full active:bg-surface-3"
            >
              <Pencil className="size-5" />
            </Link>
          )}
          <IconButton
            label="Salvar como modelo da academia"
            icon={<Copy className="size-5" />}
            onClick={() =>
              router.post(`/treinos/${p.id}/salvar-como-modelo`, {}, { preserveScroll: true })
            }
          />
          {onArchive && (
            <IconButton
              label="Encerrar treino"
              icon={<Archive className="size-5" />}
              onClick={onArchive}
            />
          )}
        </div>
      )}
    </li>
  )
}
