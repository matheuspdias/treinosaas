import { Lock, LogOut, RefreshCw, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { logoutAcademy, syncNow } from '@/data/sync'
import type { AcademySession } from '@/domain/types'
import { OFFLINE_GRACE_DAYS } from '@/domain/academy'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'

/**
 * Tela única do app quando o acesso está bloqueado (academia suspensa) ou quando faz tempo
 * demais sem internet para confirmar o acesso. Os dados do aparelho continuam guardados.
 */
export function AccessBlockedScreen({
  session,
  reason,
  message,
}: {
  session: AcademySession
  reason: 'blocked' | 'needs_connection'
  message: string | null
}) {
  const [checking, setChecking] = useState(false)
  const blocked = reason === 'blocked'
  const Icon = blocked ? Lock : WifiOff

  const retry = async () => {
    setChecking(true)
    await syncNow()
    setChecking(false)
    if (!navigator.onLine) toast('Sem internet. Conecte-se e tente de novo.', { tone: 'error' })
  }

  const leave = async () => {
    const ok = await confirm({
      title: 'Sair do app?',
      description:
        'Você volta para a tela de entrada. Seus treinos continuam guardados no aparelho.',
      confirmLabel: 'Sair',
      tone: 'danger',
    })
    if (ok) await logoutAcademy()
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8 safe-top safe-bottom">
      <span
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-warning-soft text-warning"
        aria-hidden
      >
        <Icon className="size-8" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight">
        {blocked ? 'Acesso suspenso' : 'Conecte-se à internet'}
      </h1>
      <Card className="mt-5 p-5" role="alert">
        <p className="font-semibold">{session.academy.name}</p>
        <p className="mt-1 text-fg-muted">
          {blocked
            ? (message ?? 'Seu acesso está bloqueado. Fale com o dono ou a recepção da academia.')
            : `Faz mais de ${OFFLINE_GRACE_DAYS} dias sem confirmar seu acesso com a academia. Conecte-se para continuar usando o app.`}
        </p>
        {blocked && (
          <p className="mt-3 text-sm text-fg-muted">
            Seus treinos e seu histórico continuam guardados no aparelho e voltam assim que o acesso
            for liberado.
          </p>
        )}
      </Card>
      <div className="mt-5 grid gap-2">
        <Button
          size="lg"
          block
          disabled={checking}
          icon={<RefreshCw className={checking ? 'size-5 animate-spin' : 'size-5'} />}
          onClick={() => void retry()}
        >
          {checking ? 'Verificando...' : 'Tentar de novo'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          block
          icon={<LogOut className="size-5" />}
          onClick={() => void leave()}
        >
          Sair
        </Button>
      </div>
    </main>
  )
}
