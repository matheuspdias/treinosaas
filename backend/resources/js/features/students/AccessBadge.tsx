import { KeyRound, Lock, Timer } from 'lucide-react'
import type { AccessState } from '@/types'
import { Badge } from '@/ui/components/Badge'

/** Situação do acesso ao app (só mostra quando precisa de atenção). */
export function AccessBadge({ access }: { access: AccessState }) {
  switch (access) {
    case 'pending':
      return (
        <Badge tone="accent" icon={<Timer className="size-3.5" />}>
          Primeiro acesso pendente
        </Badge>
      )
    case 'expired':
      return (
        <Badge tone="warning" icon={<KeyRound className="size-3.5" />}>
          Acesso não liberado
        </Badge>
      )
    case 'locked':
      return (
        <Badge tone="danger" icon={<Lock className="size-3.5" />}>
          Bloqueado por tentativas
        </Badge>
      )
    default:
      return null
  }
}
