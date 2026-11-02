import { Check, Plus, Search } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  exerciseImage,
  loadCatalog,
  searchCatalog,
  type Catalog,
  type CatalogExercise,
} from '@/lib/catalog'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { Chip } from '@/ui/components/Chip'
import { inputClass } from '@/ui/components/Field'
import { Sheet } from '@/ui/components/Sheet'
import { Spinner } from '@/ui/components/Spinner'

const PAGE = 60

/** Escolhe exercícios do catálogo (o mesmo do app). Dá para adicionar vários sem fechar. */
export function ExercisePicker({
  open,
  catalogUrl,
  planName,
  onAdd,
  onClose,
}: {
  open: boolean
  catalogUrl: string
  planName: string
  onAdd: (exercise: CatalogExercise) => void
  onClose: () => void
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [added, setAdded] = useState<string[]>([])
  const [limit, setLimit] = useState(PAGE)
  const deferred = useDeferredValue(query)

  useEffect(() => {
    if (!open || catalog) return
    loadCatalog(catalogUrl).then(setCatalog, (e: Error) => setError(e.message))
  }, [open, catalog, catalogUrl])

  const results = useMemo(
    () => (catalog ? searchCatalog(catalog, deferred, group) : []),
    [catalog, deferred, group],
  )

  const close = () => {
    setAdded([])
    setQuery('')
    setLimit(PAGE)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={`Adicionar em ${planName}`}
      className="sm:max-w-2xl"
      footer={
        <Button block onClick={close}>
          {added.length
            ? `Pronto (${added.length} adicionado${added.length > 1 ? 's' : ''})`
            : 'Fechar'}
        </Button>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-3 bg-surface px-5 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            autoFocus
            aria-label="Buscar exercício"
            placeholder="Buscar: supino, agachamento, puxada..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            className={cn(inputClass, 'pl-12')}
          />
        </div>
        {catalog && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <Chip selected={group === null} onClick={() => setGroup(null)}>
              Todos
            </Chip>
            {catalog.groups.map((g) => (
              <Chip
                key={g.id}
                selected={group === g.id}
                onClick={() => setGroup(group === g.id ? null : g.id)}
              >
                {g.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {error && <p className="py-6 text-center text-danger">{error}</p>}
      {!catalog && !error && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {catalog && results.length === 0 && (
        <p className="py-6 text-center text-fg-muted">Nenhum exercício encontrado.</p>
      )}
      <ul className="flex flex-col gap-1">
        {results.slice(0, limit).map((ex) => {
          const count = added.filter((id) => id === ex.id).length
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(ex)
                  setAdded((a) => [...a, ex.id])
                }}
                className="flex min-h-touch-lg w-full items-center gap-3 rounded-control px-2 py-2 text-left active:bg-surface-2 lg:hover:bg-surface-2"
              >
                <img
                  src={exerciseImage(ex.id)}
                  alt=""
                  loading="lazy"
                  className="size-14 shrink-0 rounded-control bg-surface-2 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{ex.name}</span>
                  <span className="block truncate text-sm text-fg-muted">
                    {[
                      ex.groups
                        .map((g) => catalog!.groups.find((x) => x.id === g)?.label)
                        .filter(Boolean)
                        .join(', '),
                      ex.equipment && catalog!.equipment[ex.equipment],
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    count ? 'bg-accent text-accent-fg' : 'bg-surface-2',
                  )}
                  aria-label={count ? `Adicionado ${count}x` : 'Adicionar'}
                >
                  {count ? <Check className="size-5" /> : <Plus className="size-5" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {results.length > limit && (
        <Button variant="ghost" block onClick={() => setLimit((l) => l + PAGE)} className="mt-2">
          Mostrar mais ({results.length - limit})
        </Button>
      )}
    </Sheet>
  )
}
