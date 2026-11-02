import { router, useForm } from '@inertiajs/react'
import { Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Notice } from '@/types'
import { Badge } from '@/ui/components/Badge'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { ConfirmSheet } from '@/ui/components/ConfirmSheet'
import { EmptyState } from '@/ui/components/EmptyState'
import { TextArea, TextField } from '@/ui/components/Field'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { Sheet } from '@/ui/components/Sheet'
import { Switch } from '@/ui/components/Switch'

const status = (n: Notice): { label: string; tone: 'neutral' | 'accent' | 'warning' } => {
  const now = Date.now()
  if (new Date(n.publishedAt).getTime() > now)
    return { label: `Publica em ${formatDateTime(n.publishedAt)}`, tone: 'warning' }
  if (n.expiresAt && new Date(n.expiresAt).getTime() <= now)
    return { label: 'Expirado', tone: 'neutral' }
  return { label: 'No app', tone: 'accent' }
}

export default function NoticesIndex({ notices }: { notices: Notice[] }) {
  const [editing, setEditing] = useState<Notice | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Notice | null>(null)

  return (
    <PanelLayout title="Avisos" width="narrow">
      <PageHeader
        title="Mural de avisos"
        subtitle="Aparece na tela inicial do app dos alunos"
        actions={
          <Button icon={<Plus className="size-5" />} onClick={() => setEditing('new')}>
            <span className="hidden sm:inline">Novo aviso</span>
          </Button>
        }
      />
      <div className="px-4 pt-2 lg:px-6">
        {notices.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Megaphone className="size-8" />}
              title="Nenhum aviso"
              description="Horários de feriado, aulas novas, eventos: tudo chega no celular dos alunos."
              action={
                <Button block onClick={() => setEditing('new')}>
                  Escrever aviso
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {notices.map((n) => {
              const s = status(n)
              return (
                <li key={n.id}>
                  <Card className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {n.pinned && <Pin className="size-4 text-accent" aria-label="Fixado" />}
                          <h2 className="font-bold">{n.title}</h2>
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-fg-muted">{n.body}</p>
                        <p className="mt-2 text-xs text-fg-subtle">
                          Publicado em {formatDate(n.publishedAt)}
                          {n.expiresAt && ` · sai do app em ${formatDate(n.expiresAt)}`}
                        </p>
                      </div>
                      <div className="-mr-2 flex shrink-0">
                        <IconButton
                          label="Editar aviso"
                          icon={<Pencil className="size-5" />}
                          onClick={() => setEditing(n)}
                        />
                        <IconButton
                          label="Excluir aviso"
                          icon={<Trash2 className="size-5" />}
                          onClick={() => setDeleting(n)}
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editing !== null && (
        <NoticeSheet
          key={editing === 'new' ? 'new' : editing.id}
          notice={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmSheet
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Excluir aviso?"
        description="Ele some do app dos alunos."
        confirmLabel="Excluir"
        danger
        onConfirm={() =>
          deleting &&
          router.delete(`/avisos/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
          })
        }
      />
    </PanelLayout>
  )
}

/** datetime-local ↔ ISO, no fuso do navegador. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)

function NoticeSheet({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const form = useForm({
    title: notice?.title ?? '',
    body: notice?.body ?? '',
    pinned: notice?.pinned ?? false,
    published_at: notice?.publishedAt ?? null,
    expires_at: notice?.expiresAt ?? null,
  })

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const options = { preserveScroll: true, onSuccess: onClose }
    if (notice) form.put(`/avisos/${notice.id}`, options)
    else form.post('/avisos', options)
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={notice ? 'Editar aviso' : 'Novo aviso'}
      footer={
        <Button block disabled={form.processing} onClick={() => submit()}>
          {notice ? 'Salvar' : 'Publicar no app'}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Título"
          maxLength={120}
          placeholder="Ex.: Horário de feriado"
          value={form.data.title}
          onChange={(e) => form.setData('title', e.target.value)}
          error={form.errors.title}
        />
        <TextArea
          label="Mensagem"
          rows={5}
          maxLength={3000}
          value={form.data.body}
          onChange={(e) => form.setData('body', e.target.value)}
          error={form.errors.body}
        />
        <Switch
          label="Fixar no topo"
          checked={form.data.pinned}
          onChange={(v) => form.setData('pinned', v)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Publicar em"
            type="datetime-local"
            hint="vazio = agora"
            value={toLocalInput(form.data.published_at)}
            onChange={(e) => form.setData('published_at', fromLocalInput(e.target.value))}
            error={form.errors.published_at}
          />
          <TextField
            label="Sai do app em"
            type="datetime-local"
            hint="opcional"
            value={toLocalInput(form.data.expires_at)}
            onChange={(e) => form.setData('expires_at', fromLocalInput(e.target.value))}
            error={form.errors.expires_at}
          />
        </div>
      </form>
    </Sheet>
  )
}
