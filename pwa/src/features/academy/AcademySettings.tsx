import { Building2, LogIn, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAcademyFeed, useAcademySession, useOutboxCount } from '@/data/hooks'
import { logoutAcademy, syncNow } from '@/data/sync'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { ChangePinSheet } from './ChangePinSheet'
import { formatTime } from './strings'

/** Conteúdo da seção "Minha academia" dos Ajustes. Some quando o app não tem API configurada. */
export function AcademySettings() {
  const session = useAcademySession()
  const feed = useAcademyFeed()
  const pending = useOutboxCount()
  const [pinOpen, setPinOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  if (session === undefined) return null

  if (!session) {
    return (
      <div className="space-y-3">
        {feed.lastError && <p className="text-warning">{feed.lastError}</p>}
        <p className="text-fg-muted">
          Treina numa academia que usa o app? Entre com o celular cadastrado para receber seus
          treinos. Suas fichas pessoais continuam aqui.
        </p>
        <Link to="/academia/entrar" className={buttonClass({ block: true })}>
          <LogIn className="size-5" />
          Entrar com minha academia
        </Link>
      </div>
    )
  }

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
          ? `${pending === 1 ? '1 item ainda não foi enviado' : `${pending} itens ainda não foram enviados`} para a academia e vai se perder. Seus treinos continuam no aparelho, e as fichas da academia ficam arquivadas.`
          : 'Seus treinos continuam no aparelho. As fichas da academia ficam arquivadas e você para de receber treinos novos.',
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
          Sair da academia
        </Button>
      </div>
      <ChangePinSheet open={pinOpen} onClose={() => setPinOpen(false)} />
    </div>
  )
}
