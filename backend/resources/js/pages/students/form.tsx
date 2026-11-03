import { useForm } from '@inertiajs/react'
import { Info } from 'lucide-react'
import type { FormEvent } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { maskPhone } from '@/lib/format'
import type { StudentSummary } from '@/types'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { TextField } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'

export default function StudentForm({ student }: { student: StudentSummary | null }) {
  const editing = student !== null
  const form = useForm({ name: student?.name ?? '', phone: student?.phone ?? '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (editing) form.put(`/alunos/${student.id}`)
    else form.post('/alunos')
  }

  return (
    <PanelLayout title={editing ? 'Editar aluno' : 'Novo aluno'} width="narrow">
      <PageHeader
        title={editing ? 'Editar aluno' : 'Novo aluno'}
        back={editing ? `/alunos/${student.id}` : '/alunos'}
      />
      <form onSubmit={submit} className="flex flex-col gap-4 px-4 pt-2 lg:px-6">
        <Card className="flex flex-col gap-4 p-5">
          <TextField
            label="Nome"
            autoComplete="off"
            autoFocus={!editing}
            required
            value={form.data.name}
            onChange={(e) => form.setData('name', e.target.value)}
            error={form.errors.name}
          />
          <TextField
            label="Celular com DDD"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(11) 91234-5678"
            required
            value={form.data.phone}
            onChange={(e) => form.setData('phone', maskPhone(e.target.value))}
            error={form.errors.phone}
            hint="É com ele que o aluno entra no app"
          />
        </Card>

        <div className="flex items-start gap-3 rounded-card bg-accent-soft p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0" />
          <p>
            {editing
              ? 'Se mudar o celular, o aluno sai do app em todos os aparelhos e entra de novo com o número novo.'
              : 'Depois de cadastrar, envie o link do app pela ficha do aluno (botão do WhatsApp). Ele entra com este celular e cria um PIN. O primeiro acesso fica liberado por 48 horas.'}
          </p>
        </div>

        <Button type="submit" size="lg" disabled={form.processing} className="lg:self-start">
          {editing ? 'Salvar alterações' : 'Cadastrar aluno'}
        </Button>
      </form>
    </PanelLayout>
  )
}
