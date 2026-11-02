import { Link, router, useForm } from '@inertiajs/react'
import { Archive, ClipboardList, Pencil, Plus, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { normalize } from '@/lib/catalog'
import { formatDate, isoDateInWeeks, validityLabel } from '@/lib/format'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { Chip } from '@/ui/components/Chip'
import { ConfirmSheet } from '@/ui/components/ConfirmSheet'
import { EmptyState } from '@/ui/components/EmptyState'
import { inputClass } from '@/ui/components/Field'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { Sheet } from '@/ui/components/Sheet'
import { Switch } from '@/ui/components/Switch'

interface Template {
  id: string
  name: string
  notes: string | null
  plansCount: number
  updatedAt: string
}

interface Props {
  templates: Template[]
  students: { id: string; name: string }[]
  filters: { busca: string | null }
}

export default function ProgramsIndex({ templates, students }: Props) {
  const [assigning, setAssigning] = useState<Template | null>(null)
  const [archiving, setArchiving] = useState<Template | null>(null)

  return (
    <PanelLayout title="Treinos">
      <PageHeader
        title="Modelos de treino"
        subtitle="Monte uma vez e envie para vários alunos"
        actions={
          <Link href="/treinos/novo" className={buttonClass()}>
            <Plus className="size-5" />
            <span className="hidden sm:inline">Novo modelo</span>
          </Link>
        }
      />
      <div className="px-4 pt-2 lg:px-6">
        {templates.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ClipboardList className="size-8" />}
              title="Nenhum modelo ainda"
              description="Modelos são as fichas da academia (ABC, Full Body...). Cada aluno recebe uma cópia, que pode ser ajustada só para ele."
              action={
                <Link href="/treinos/novo" className={buttonClass({ block: true })}>
                  Criar primeiro modelo
                </Link>
              }
            />
          </Card>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <li key={t.id}>
                <Card className="flex h-full flex-col gap-3 p-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{t.name}</h2>
                    <p className="text-sm text-fg-muted">
                      {t.plansCount} {t.plansCount === 1 ? 'ficha' : 'fichas'} · atualizado em{' '}
                      {formatDate(t.updatedAt)}
                    </p>
                    {t.notes && (
                      <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{t.notes}</p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      icon={<Send className="size-4" />}
                      onClick={() => setAssigning(t)}
                      className="flex-1"
                    >
                      Enviar para alunos
                    </Button>
                    <Link
                      href={`/treinos/${t.id}/editar`}
                      aria-label={`Editar ${t.name}`}
                      title="Editar"
                      className="inline-flex size-touch items-center justify-center rounded-full bg-surface-2 active:bg-surface-3"
                    >
                      <Pencil className="size-5" />
                    </Link>
                    <IconButton
                      label="Arquivar modelo"
                      variant="secondary"
                      icon={<Archive className="size-5" />}
                      onClick={() => setArchiving(t)}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {assigning && (
        <AssignSheet template={assigning} students={students} onClose={() => setAssigning(null)} />
      )}
      <ConfirmSheet
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        title="Arquivar modelo?"
        description="Os alunos que já receberam continuam com o treino deles."
        confirmLabel="Arquivar"
        onConfirm={() =>
          archiving &&
          router.post(
            `/treinos/${archiving.id}/arquivar`,
            {},
            { onFinish: () => setArchiving(null) },
          )
        }
      />
    </PanelLayout>
  )
}

const WEEKS = [4, 6, 8, 12]

function AssignSheet({
  template,
  students,
  onClose,
}: {
  template: Template
  students: { id: string; name: string }[]
  onClose: () => void
}) {
  const form = useForm({
    student_ids: [] as string[],
    expires_on: isoDateInWeeks(6) as string | null,
    replace_current: true,
  })
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const q = normalize(query)
    return students.filter((s) => normalize(s.name).includes(q))
  }, [students, query])
  const selected = new Set(form.data.student_ids)
  const toggle = (id: string) =>
    form.setData(
      'student_ids',
      selected.has(id)
        ? form.data.student_ids.filter((x) => x !== id)
        : [...form.data.student_ids, id],
    )

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Enviar "${template.name}"`}
      description="Cada aluno recebe a própria cópia e é avisado no app."
      footer={
        <>
          {form.errors.student_ids && (
            <p className="text-sm text-danger">{form.errors.student_ids}</p>
          )}
          <Button
            block
            disabled={form.processing || selected.size === 0}
            onClick={() =>
              form.post(`/treinos/${template.id}/aplicar`, {
                preserveScroll: true,
                onSuccess: onClose,
              })
            }
          >
            {selected.size === 0
              ? 'Escolha os alunos'
              : `Enviar para ${selected.size} ${selected.size === 1 ? 'aluno' : 'alunos'}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-fg-muted">Validade</p>
          <div className="flex flex-wrap gap-2">
            {WEEKS.map((w) => (
              <Chip
                key={w}
                selected={form.data.expires_on === isoDateInWeeks(w)}
                onClick={() => form.setData('expires_on', isoDateInWeeks(w))}
              >
                {w} semanas
              </Chip>
            ))}
            <Chip
              selected={form.data.expires_on === null}
              onClick={() => form.setData('expires_on', null)}
            >
              Sem validade
            </Chip>
          </div>
          {form.data.expires_on && (
            <p className="mt-1 text-sm text-fg-subtle">{validityLabel(form.data.expires_on)}</p>
          )}
        </div>
        <Switch
          label="Substituir o treino atual"
          description="O treino anterior de cada aluno vai para o histórico."
          checked={form.data.replace_current}
          onChange={(v) => form.setData('replace_current', v)}
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-fg-muted">
              Alunos ({selected.size} de {students.length})
            </p>
            <button
              type="button"
              className="min-h-11 text-sm font-semibold"
              onClick={() =>
                form.setData(
                  'student_ids',
                  selected.size === visible.length ? [] : visible.map((s) => s.id),
                )
              }
            >
              {selected.size === visible.length && visible.length > 0
                ? 'Limpar'
                : 'Selecionar todos'}
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              aria-label="Filtrar alunos"
              placeholder="Filtrar alunos"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(inputClass, 'pl-12')}
            />
          </div>
          <ul className="flex flex-col">
            {visible.map((s) => (
              <li key={s.id}>
                <label className="flex min-h-touch items-center gap-3 rounded-control px-2 active:bg-surface-2">
                  <input
                    type="checkbox"
                    className="size-5 accent-[var(--c-accent)]"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="font-medium">{s.name}</span>
                </label>
              </li>
            ))}
            {visible.length === 0 && (
              <p className="py-4 text-center text-fg-muted">Nenhum aluno ativo encontrado.</p>
            )}
          </ul>
        </div>
      </div>
    </Sheet>
  )
}
