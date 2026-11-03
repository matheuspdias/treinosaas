import { Building2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useAcademyFeed, useAcademySession, useOutboxCount } from '@/data/hooks'
import { logoutAcademy, syncNow } from '@/data/sync'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { ChangePinSheet } from './ChangePinSheet'
import { formatTime } from './strings'

/** Conteúdo da seção "Minha academia" dos Ajustes. */
export function AcademySettings() {
  const session = useAcademySession()
  const feed = useAcademyFeed()
  const pending = useOutboxCount()
  const [pinOpen, setPinOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Sem sessão o app inteiro fica na tela de entrada (AccessGate).
  if (!session) return null

  const sync = async () => {
    setSyncing(true)
    await syncNow()
    setSyncing(false)
  }

  const leave = async () => {
    const ok = await confirm({
      title: 'Sair da academia?',
      description:
        pending > 0
          ? `${pending === 1 ? '1 item ainda não foi enviado' : `${pending} itens ainda não foram enviados`} para a academia e vai se perder. Para usar o app de novo, entre com seu celular e PIN.`
          : 'Para usar o app de novo (nesta ou em outra academia), entre com seu celular e PIN. Seu histórico continua no aparelho.',
      confirmLabel: 'Sair',
      tone: 'danger',
    })
    if (!ok) return
    await logoutAcademy()
    toast('Você saiu da academia.', { tone: 'success' })
  }

  const status = feed.lastError
    ? feed.lastError
    : pending > 0
      ? `${pending === 1 ? '1 treino esperando' : `${pending} treinos esperando`} internet para ir para a academia.`
      : feed.lastSyncAt
        ? `Sincronizado às ${formatTime(feed.lastSyncAt)}.`
        : 'Sincronizando...'

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
          aria-hidden
        >
          <Building2 className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{session.academy.name}</p>
          <p className="text-fg-muted">
            {session.student.name}
            {session.student.phoneMasked && ` · ${session.student.phoneMasked}`}
          </p>
        </div>
      </div>
      <p className={feed.lastError ? 'text-warning' : 'text-sm text-fg-muted'} role="status">
        {status}
      </p>
      <div className="grid gap-2">
        <Button
          variant="secondary"
          block
          disabled={syncing}
          icon={<RefreshCw className={syncing ? 'size-5 animate-spin' : 'size-5'} />}
          onClick={() => void sync()}
        >
          Sincronizar agora
        </Button>
        <Button variant="secondary" block onClick={() => setPinOpen(true)}>
          Trocar PIN
        </Button>
        <Button variant="danger" block onClick={() => void leave()}>
          Sair ou trocar de academia
        </Button>
      </div>
      <ChangePinSheet open={pinOpen} onClose={() => setPinOpen(false)} />
    </div>
  )
}
