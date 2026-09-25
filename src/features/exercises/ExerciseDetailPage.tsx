import { History, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CATEGORY_PT_BR, EQUIPMENT_PT_BR, MUSCLE_PT_BR } from '@/catalog/i18n/pt-BR'
import { repos } from '@/data'
import type { ExerciseSource } from '@/domain/types'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { EmptyState } from '@/ui/components/EmptyState'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { PageSpinner } from '@/ui/components/Spinner'
import { AddToPlanSheet } from './components/AddToPlanSheet'
import { ExerciseMediaView } from './components/ExerciseMediaView'
import { useExerciseLookup } from './hooks/useExerciseLookup'

export function ExerciseDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const lookup = useExerciseLookup()
  const [adding, setAdding] = useState(false)
  const ref = { source: (params.source ?? 'catalog') as ExerciseSource, id: params.id ?? '' }
  const ex = lookup.get(ref)

  if (!lookup.ready) return <PageSpinner />
  if (!ex) {
    return (
      <EmptyState
        title="Exercício não encontrado"
        action={
          <Link to="/exercicios" className={buttonClass({ block: true })}>
            Ver exercícios
          </Link>
        }
      />
    )
  }

  const isCustom = ref.source === 'custom'
  const remove = async () => {
    const ok = await confirm({
      title: `Excluir "${ex.name}"?`,
      description:
        'Ele sai da biblioteca. Treinos já registrados mantêm o histórico. Se estiver em alguma ficha, aparecerá como "Exercício removido".',
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return
    await repos.customExercises.remove(ref.id)
    toast('Exercício excluído.')
    navigate('/exercicios', { replace: true })
  }

  return (
    <>
      <PageHeader
        back
        title={ex.name}
        actions={
          isCustom && (
            <>
              <IconButton
                label="Editar exercício"
                icon={<Pencil className="size-5" />}
                onClick={() => navigate(`/exercicios/custom/${ref.id}/editar`)}
              />
              <IconButton
                label="Excluir exercício"
                icon={<Trash2 className="size-5" />}
                onClick={remove}
              />
            </>
          )
        }
      />
      <div className="space-y-6 px-4 pb-8">
        <ExerciseMediaView exRef={ex.ref} name={ex.name} />

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{ex.name}</h2>
          {ex.nameEn && ex.nameEn !== ex.name && <p className="text-fg-muted">{ex.nameEn}</p>}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-surface p-4">
            <dt className="text-sm text-fg-subtle">Músculos principais</dt>
            <dd className="mt-1 font-semibold">
              {ex.primaryMuscles.map((m) => MUSCLE_PT_BR[m]).join(', ') || '—'}
            </dd>
          </div>
          <div className="rounded-card bg-surface p-4">
            <dt className="text-sm text-fg-subtle">Equipamento</dt>
            <dd className="mt-1 font-semibold">
              {ex.equipment ? EQUIPMENT_PT_BR[ex.equipment] : '—'}
            </dd>
          </div>
          {ex.secondaryMuscles.length > 0 && (
            <div className="col-span-2 rounded-card bg-surface p-4">
              <dt className="text-sm text-fg-subtle">Músculos auxiliares</dt>
              <dd className="mt-1 font-semibold">
                {ex.secondaryMuscles.map((m) => MUSCLE_PT_BR[m]).join(', ')}
              </dd>
            </div>
          )}
          {ex.category && ex.category !== 'strength' && (
            <div className="col-span-2 rounded-card bg-surface p-4">
              <dt className="text-sm text-fg-subtle">Tipo</dt>
              <dd className="mt-1 font-semibold">{CATEGORY_PT_BR[ex.category] ?? ex.category}</dd>
            </div>
          )}
        </dl>

        {ex.instructions.length > 0 && (
          <section>
            <h3 className="mb-2 text-lg font-bold">
              Execução{' '}
              {!isCustom && <span className="text-sm font-normal text-fg-subtle">(em inglês)</span>}
            </h3>
            <ol
              className="list-decimal space-y-2 pl-5 text-fg-muted"
              lang={isCustom ? 'pt-BR' : 'en'}
            >
              {ex.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        <Link
          to={`/exercicios/${ref.source}/${encodeURIComponent(ref.id)}/historico`}
          className={buttonClass({ variant: 'secondary', block: true, size: 'lg' })}
        >
          <History className="size-5" />
          Ver histórico e recordes
        </Link>
        <Button size="lg" block icon={<Plus className="size-5" />} onClick={() => setAdding(true)}>
          Adicionar a uma ficha
        </Button>
      </div>
      <AddToPlanSheet
        exRef={ex.ref}
        name={ex.name}
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={(id) => navigate(`/fichas/${id}`)}
      />
    </>
  )
}
