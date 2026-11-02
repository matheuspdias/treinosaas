import { Check, TrendingUp } from 'lucide-react'
import type { ProgressionSuggestion, WeightUnit } from '@/domain/types'
import { formatWeight } from '@/domain/units'
import { Button } from '@/ui/components/Button'

/** Sugestão de dupla progressão: aparece no exercício e o usuário aceita ou ignora. */
export function ProgressionCard({
  suggestion,
  repMax,
  unit,
  onAccept,
  onDismiss,
}: {
  suggestion: ProgressionSuggestion
  repMax: number
  unit: WeightUnit
  onAccept: () => void
  onDismiss: () => void
}) {
  if (suggestion.status === 'dismissed') return null
  if (suggestion.status === 'accepted') {
    return (
      <p
        className="mt-3 flex items-center gap-2 rounded-control bg-accent-soft px-3 py-2.5 text-sm font-semibold"
        role="status"
      >
        <Check className="size-4 shrink-0 text-accent" strokeWidth={3} aria-hidden />
        Carga aumentada para {formatWeight(suggestion.toKg, unit)}
      </p>
    )
  }
  return (
    <section
      aria-label="Sugestão de progressão"
      className="mt-3 rounded-card border border-accent/50 bg-accent-soft p-4"
    >
      <p className="flex items-center gap-2 font-bold">
        <TrendingUp className="size-5 shrink-0 text-accent" aria-hidden />
        Hora de subir a carga
      </p>
      <p className="mt-1 text-sm text-fg-muted">
        Na última vez você fez todas as séries com {repMax}+ repetições. Sugestão:{' '}
        <strong className="text-fg tabular">
          {formatWeight(suggestion.fromKg, unit)} → {formatWeight(suggestion.toKg, unit)}
        </strong>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={onDismiss}>
          Agora não
        </Button>
        <Button onClick={onAccept}>Aplicar</Button>
      </div>
    </section>
  )
}
