import { Check, Search, X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLE_PT_BR, EQUIPMENT_PT_BR } from '@/catalog/i18n/pt-BR'
import { exerciseSubtitle, refKey } from '../exerciseFormat'
import { searchExercises } from '@/catalog/search'
import type { ExerciseFilters } from '@/catalog/search'
import { EQUIPMENT, MUSCLES } from '@/domain/types'
import type { ExerciseRef } from '@/domain/types'
import { cn } from '@/ui/cn'
import { Chip } from '@/ui/components/Chip'
import { EmptyState } from '@/ui/components/EmptyState'
import { inputClass } from '@/ui/components/Field'
import { PageSpinner } from '@/ui/components/Spinner'
import { useExerciseLookup } from '../hooks/useExerciseLookup'
import type { LibraryExercise } from '../hooks/useExerciseLookup'
import { ExerciseThumb } from './ExerciseThumb'

const PAGE = 40

interface Props {
  filters: ExerciseFilters
  onFiltersChange: (patch: Partial<ExerciseFilters>) => void
  onOpen: (ex: LibraryExercise) => void
  /** Modo seleção (adicionar à ficha). */
  selected?: ReadonlySet<string>
  onToggle?: (ref: ExerciseRef) => void
}

export function ExerciseBrowser({ filters, onFiltersChange, onOpen, selected, onToggle }: Props) {
  const lookup = useExerciseLookup()
  const deferredQuery = useDeferredValue(filters.query)
  // A paginação reinicia quando a busca/filtros mudam.
  const filterKey = `${deferredQuery}|${filters.muscle ?? ''}|${filters.equipment ?? ''}`
  const [paging, setPaging] = useState({ key: filterKey, limit: PAGE })
  const limit = paging.key === filterKey ? paging.limit : PAGE
  const sentinel = useRef<HTMLDivElement>(null)

  const results = useMemo(
    () => searchExercises(lookup.all, { ...filters, query: deferredQuery }),
    [lookup.all, filters, deferredQuery],
  )

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) =>
        e?.isIntersecting &&
        setPaging((p) => ({
          key: filterKey,
          limit: (p.key === filterKey ? p.limit : PAGE) + PAGE,
        })),
      { rootMargin: '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [results.length, filterKey])

  const selecting = selected !== undefined

  return (
    <div>
      <div className="sticky top-16 z-10 space-y-2 bg-bg/95 px-4 pt-1 pb-3 backdrop-blur-md">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            enterKeyHint="search"
            aria-label="Buscar exercício"
            placeholder="Buscar (ex.: supino, remada, squat)"
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
            className={cn(inputClass, 'pl-11', filters.query && 'pr-12')}
          />
          {filters.query && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => onFiltersChange({ query: '' })}
              className="absolute top-0 right-0 flex size-touch items-center justify-center text-fg-subtle"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label="Filtrar por grupo muscular"
          className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1"
        >
          <Chip
            selected={filters.muscle === null}
            onClick={() => onFiltersChange({ muscle: null })}
          >
            Todos
          </Chip>
          {MUSCLES.map((m) => (
            <Chip
              key={m}
              selected={filters.muscle === m}
              onClick={() => onFiltersChange({ muscle: filters.muscle === m ? null : m })}
            >
              {MUSCLE_PT_BR[m]}
            </Chip>
          ))}
        </div>
        <div
          role="group"
          aria-label="Filtrar por equipamento"
          className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4"
        >
          <Chip
            selected={filters.equipment === null}
            onClick={() => onFiltersChange({ equipment: null })}
          >
            Qualquer equipamento
          </Chip>
          {EQUIPMENT.map((eq) => (
            <Chip
              key={eq}
              selected={filters.equipment === eq}
              onClick={() => onFiltersChange({ equipment: filters.equipment === eq ? null : eq })}
            >
              {EQUIPMENT_PT_BR[eq]}
            </Chip>
          ))}
        </div>
      </div>

      {!lookup.ready ? (
        <PageSpinner />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-8" />}
          title="Nenhum exercício encontrado"
          description="Tente outro nome, em português ou inglês, ou limpe os filtros."
        />
      ) : (
        <>
          <p className="px-4 pb-2 text-sm text-fg-subtle" aria-live="polite">
            {results.length} {results.length === 1 ? 'exercício' : 'exercícios'}
          </p>
          <ul className="px-2">
            {results.slice(0, limit).map((ex) => {
              const key = refKey(ex.ref)
              const isSelected = selected?.has(key) ?? false
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={selecting ? isSelected : undefined}
                    onClick={() => (selecting ? onToggle?.(ex.ref) : onOpen(ex))}
                    className={cn(
                      'flex min-h-18 w-full items-center gap-3 rounded-card px-2 py-2 text-left active:bg-surface-2',
                      isSelected && 'bg-accent-soft',
                    )}
                  >
                    <ExerciseThumb exRef={ex.ref} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold">{ex.name}</span>
                      <span className="block truncate text-sm text-fg-muted">
                        {exerciseSubtitle(ex)}
                      </span>
                    </span>
                    {selecting && (
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                          isSelected ? 'border-accent bg-accent text-accent-fg' : 'border-border',
                        )}
                        aria-hidden
                      >
                        {isSelected && <Check className="size-5" strokeWidth={3} />}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {limit < results.length && <div ref={sentinel} className="h-8" aria-hidden />}
        </>
      )}
    </div>
  )
}
