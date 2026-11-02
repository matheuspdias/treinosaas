import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { EMPTY_FILTERS } from '@/catalog/search'
import type { ExerciseFilters } from '@/catalog/search'
import { isAcademyPlan } from '@/domain/academy'
import type { ExerciseRef } from '@/domain/types'
import { usePlan } from '@/data/hooks'
import { addExercisesToPlan } from '@/features/plans/planActions'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { PageHeader } from '@/ui/components/PageHeader'
import { ExerciseBrowser } from './components/ExerciseBrowser'
import { refKey } from './exerciseFormat'

/** Seleção múltipla de exercícios para adicionar a uma ficha. */
export function ExercisePickerPage() {
  const { planId } = useParams()
  const plan = usePlan(planId)
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<ExerciseRef[]>([])
  const keys = new Set(selected.map(refKey))
  const back = `/fichas/${planId ?? ''}`

  const toggle = (ref: ExerciseRef) =>
    setSelected((list) =>
      list.some((r) => refKey(r) === refKey(ref))
        ? list.filter((r) => refKey(r) !== refKey(ref))
        : [...list, ref],
    )

  const add = async () => {
    if (!planId || selected.length === 0) return
    await addExercisesToPlan(planId, selected)
    toast(
      selected.length === 1
        ? 'Exercício adicionado.'
        : `${selected.length} exercícios adicionados.`,
      { tone: 'success' },
    )
    navigate(back, { replace: true })
  }

  // Ficha da academia não recebe exercícios do aluno.
  if (plan && isAcademyPlan(plan)) return <Navigate to={back} replace />

  return (
    <div className="pb-28">
      <PageHeader back={back} title="Adicionar exercícios" subtitle={plan?.name} />
      <ExerciseBrowser
        filters={filters}
        onFiltersChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onOpen={() => {}}
        selected={keys}
        onToggle={toggle}
      />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 safe-bottom backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
          <Button
            variant="ghost"
            onClick={() =>
              navigate(
                `/exercicios/novo?voltar=${encodeURIComponent(`/fichas/${planId ?? ''}/adicionar`)}`,
              )
            }
            icon={<Plus className="size-5" />}
          >
            Personalizado
          </Button>
          <Button size="lg" className="flex-1" disabled={selected.length === 0} onClick={add}>
            {selected.length === 0 ? 'Selecione' : `Adicionar (${selected.length})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
