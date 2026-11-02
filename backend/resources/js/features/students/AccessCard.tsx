import { Link, router, useForm } from '@inertiajs/react'
import { KeyRound, Pencil, ShieldOff, UserCheck, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { formatDateTime } from '@/lib/format'
import type { StudentSummary } from '@/types'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { ConfirmSheet } from '@/ui/components/ConfirmSheet'
import { TextField } from '@/ui/components/Field'

function accessText(s: StudentSummary, hours: number): { title: string; text: string } {
  switch (s.access) {
    case 'active':
      return {
        title: 'Acesso ao app ativo',
        text: s.pinSetAt
          ? `PIN criado em ${formatDateTime(s.pinSetAt)}. Se não foi o aluno, libere um novo primeiro acesso.`
          : 'O aluno já criou o PIN.',
      }
    case 'pending':
      return {
        title: 'Esperando o primeiro acesso',
        text: `O aluno abre o app, toca em "Entrar com minha academia", informa o celular e cria um PIN${
          s.firstAccessUntil ? ` até ${formatDateTime(s.firstAccessUntil)}` : ''
        }.`,
      }
    case 'locked':
      return {
        title: 'Bloqueado por tentativas',
        text: 'Errou o PIN várias vezes. Libera sozinho em alguns minutos, ou libere um novo primeiro acesso.',
      }
    default:
      return {
        title: 'Primeiro acesso não liberado',
        text: `O prazo de ${hours}h para criar o PIN passou. Libere de novo quando o aluno estiver por perto.`,
      }
  }
}

export function AccessCard({ student, hours }: { student: StudentSummary; hours: number }) {
  const [confirm, setConfirm] = useState<'release' | 'deactivate' | 'anonymize' | null>(null)
  const anonymizeForm = useForm({ confirm: '' })
  const inactive = student.status === 'inactive'
  const info = accessText(student, hours)
  const close = () => setConfirm(null)

  return (
    <Card className="p-5">
      {inactive ? (
        <>
          <h2 className="font-bold">Aluno inativo</h2>
          <p className="mt-1 text-fg-muted">
            Não entra no app e não aparece nas listas. O histórico fica guardado.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-accent" />
            <h2 className="font-bold">{info.title}</h2>
          </div>
          <p className="mt-1 text-fg-muted">{info.text}</p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/alunos/${student.id}/editar`}
          className={buttonClass({ variant: 'secondary' })}
        >
          <Pencil className="size-4" /> Editar
        </Link>
        {!inactive && (
          <Button
            variant="secondary"
            icon={<KeyRound className="size-4" />}
            onClick={() => setConfirm('release')}
          >
            {student.access === 'active' ? 'Resetar PIN' : 'Liberar primeiro acesso'}
          </Button>
        )}
        {inactive ? (
          <Button
            variant="secondary"
            icon={<UserCheck className="size-4" />}
            onClick={() =>
              router.patch(
                `/alunos/${student.id}/situacao`,
                { active: true },
                { preserveScroll: true },
              )
            }
          >
            Reativar
          </Button>
        ) : (
          <Button
            variant="ghost"
            icon={<UserMinus className="size-4" />}
            onClick={() => setConfirm('deactivate')}
          >
            Inativar
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-danger"
          icon={<ShieldOff className="size-4" />}
          onClick={() => setConfirm('anonymize')}
        >
          Excluir dados (LGPD)
        </Button>
      </div>

      <ConfirmSheet
        open={confirm === 'release'}
        onClose={close}
        title={student.access === 'active' ? 'Resetar o PIN?' : 'Liberar primeiro acesso?'}
        description={`O aluno sai do app em todos os aparelhos e tem ${hours}h para entrar com o celular e criar um PIN novo. Faça isso com ele por perto.`}
        confirmLabel="Liberar"
        onConfirm={() =>
          router.post(
            `/alunos/${student.id}/liberar-acesso`,
            {},
            { preserveScroll: true, onFinish: close },
          )
        }
      />
      <ConfirmSheet
        open={confirm === 'deactivate'}
        onClose={close}
        title="Inativar aluno?"
        description="Ele sai do app na hora (os treinos dele continuam no celular) e some das listas. Dá para reativar depois."
        confirmLabel="Inativar"
        danger
        onConfirm={() =>
          router.patch(
            `/alunos/${student.id}/situacao`,
            { active: false },
            { preserveScroll: true, onFinish: close },
          )
        }
      />
      <ConfirmSheet
        open={confirm === 'anonymize'}
        onClose={close}
        title="Excluir dados pessoais?"
        description="Use quando o aluno pedir a exclusão (LGPD). Nome, celular e avaliações são apagados; os treinos ficam só como estatística, sem identificação. Não dá para desfazer."
        confirmLabel="Excluir dados"
        danger
        processing={anonymizeForm.processing}
        onConfirm={() => anonymizeForm.post(`/alunos/${student.id}/anonimizar`)}
      >
        <TextField
          label='Digite "ANONIMIZAR" para confirmar'
          autoComplete="off"
          value={anonymizeForm.data.confirm}
          onChange={(e) => anonymizeForm.setData('confirm', e.target.value)}
          error={anonymizeForm.errors.confirm}
        />
      </ConfirmSheet>
    </Card>
  )
}
