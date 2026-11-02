import { Archive, ArchiveRestore, Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Plan } from '@/domain/types'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'
import { Sheet } from '@/ui/components/Sheet'
import {
  archivePlan,
  deletePlan,
  duplicatePlanById,
  renamePlan,
  setPlanColor,
} from '../planActions'
import { ColorPicker } from './ColorPicker'

export function PlanSettingsSheet({
  plan,
  open,
  onClose,
}: {
  plan: Plan | null
  open: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={open && !!plan} onClose={onClose} title="Configurar ficha">
      {plan && <PlanSettingsBody key={plan.id} plan={plan} onClose={onClose} />}
    </Sheet>
  )
}

function PlanSettingsBody({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(plan.name)

  const saveName = () => {
    if (name.trim() && name.trim() !== plan.name) void renamePlan(plan.id, name)
  }

  return (
    <div className="space-y-6 pt-2">
      <TextField
        label="Nome"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <div>
        <p className="mb-2 text-sm font-semibold text-fg-muted">Cor</p>
        <ColorPicker value={plan.color} onChange={(c) => void setPlanColor(plan.id, c)} />
      </div>
      <div className="grid gap-2">
        <Button
          variant="secondary"
          icon={<Copy className="size-5" />}
          onClick={async () => {
            saveName()
            const copy = await duplicatePlanById(plan.id)
            onClose()
            if (copy) {
              toast('Ficha duplicada.', { tone: 'success' })
              navigate(`/fichas/${copy.id}`)
            }
          }}
        >
          Duplicar ficha
        </Button>
        <Button
          variant="secondary"
          icon={
            plan.archivedAt ? <ArchiveRestore className="size-5" /> : <Archive className="size-5" />
          }
          onClick={async () => {
            saveName()
            await archivePlan(plan.id, !plan.archivedAt)
            onClose()
            toast(
              plan.archivedAt
                ? 'Ficha restaurada para a sequência.'
                : 'Ficha arquivada. Ela sai da sequência, mas o histórico continua.',
              {
                action: {
                  label: 'Desfazer',
                  onClick: () => void archivePlan(plan.id, !!plan.archivedAt),
                },
              },
            )
          }}
        >
          {plan.archivedAt ? 'Desarquivar' : 'Arquivar'}
        </Button>
        <Button
          variant="danger"
          icon={<Trash2 className="size-5" />}
          onClick={async () => {
            const ok = await confirm({
              title: `Excluir "${plan.name}"?`,
              description:
                'A ficha será removida. Os treinos já registrados continuam no histórico.',
              confirmLabel: 'Excluir ficha',
              tone: 'danger',
            })
            if (!ok) return
            await deletePlan(plan.id)
            onClose()
            navigate('/fichas')
            toast('Ficha excluída.')
          }}
        >
          Excluir
        </Button>
      </div>
    </div>
  )
}
