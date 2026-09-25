import { useRouteError } from 'react-router'
import { Button } from '@/ui/components/Button'
import { EmptyState } from '@/ui/components/EmptyState'

export function RouteError() {
  const error = useRouteError()
  // Chunk antigo após atualização do app: recarregar resolve.
  const stale =
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed/i.test(error.message)
  return (
    <EmptyState
      title={stale ? 'O app foi atualizado' : 'Algo deu errado'}
      description={
        stale
          ? 'Recarregue para usar a nova versão. Seus dados estão salvos.'
          : 'Seus dados estão salvos. Tente recarregar a página.'
      }
      action={
        <Button block size="lg" onClick={() => location.reload()}>
          Recarregar
        </Button>
      }
    />
  )
}
