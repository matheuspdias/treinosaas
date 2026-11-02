import { useConfirmStore } from '@/stores/confirmStore'
import { Button } from '@/ui/components/Button'
import { Sheet } from '@/ui/components/Sheet'

export function ConfirmHost() {
  const { request, close } = useConfirmStore()
  return (
    <Sheet
      open={request !== null}
      onClose={() => close(false)}
      title={request?.title ?? ''}
      description={request?.description}
      footer={
        <>
          <Button
            variant={request?.tone === 'danger' ? 'danger' : 'primary'}
            size="lg"
            block
            onClick={() => close(true)}
            autoFocus
          >
            {request?.confirmLabel ?? 'Confirmar'}
          </Button>
          <Button variant="ghost" block onClick={() => close(false)}>
            {request?.cancelLabel ?? 'Cancelar'}
          </Button>
        </>
      }
    />
  )
}
