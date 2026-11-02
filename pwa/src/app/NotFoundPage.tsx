import { Link } from 'react-router'
import { buttonClass } from '@/ui/components/buttonClass'
import { EmptyState } from '@/ui/components/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      action={
        <Link to="/" className={buttonClass({ block: true, size: 'lg' })}>
          Ir para o início
        </Link>
      }
    />
  )
}
