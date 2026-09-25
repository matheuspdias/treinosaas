import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import { sequenceLetter } from '@/domain/text'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { TEMPLATES } from '@/templates/templates'
import type { WorkoutTemplate } from '@/templates/templates'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { Sheet } from '@/ui/components/Sheet'

/** Lista de modelos; tocar abre a prévia com as fichas e os exercícios. */
export function TemplateList({
  onApply,
  busy = false,
}: {
  onApply: (t: WorkoutTemplate) => void
  busy?: boolean
}) {
  const [preview, setPreview] = useState<WorkoutTemplate | null>(null)
  return (
    <>
      <ul className="space-y-3">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setPreview(t)}
              className="block w-full text-left active:opacity-80"
            >
              <Card className="flex items-center gap-3 p-4">
                <span className="flex -space-x-3" aria-hidden>
                  {t.plans.slice(0, 4).map((p, i) => (
                    <PlanBadge
                      key={p.name}
                      letter={sequenceLetter(i)}
                      color={p.color}
                      className="size-10 text-base ring-2 ring-surface"
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{t.name}</span>
                  <span className="block text-sm text-fg-muted">{t.description}</span>
                  <span className="mt-1 block text-xs font-semibold text-fg-subtle">
                    {t.frequency} · {t.level}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
              </Card>
            </button>
          </li>
        ))}
      </ul>
      <Sheet
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? `Modelo ${preview.name}` : ''}
        description={
          preview
            ? `${preview.frequency} · ${preview.level}. As cargas começam em 0: ajuste no primeiro treino.`
            : undefined
        }
        footer={
          <Button size="lg" block disabled={busy} onClick={() => preview && onApply(preview)}>
            {busy ? 'Criando fichas…' : `Usar este modelo (${preview?.plans.length ?? 0} fichas)`}
          </Button>
        }
      >
        {preview && (
          <div className="space-y-5 pt-1">
            {preview.plans.map((p, i) => (
              <section key={p.name}>
                <h3 className="mb-2 flex items-center gap-3">
                  <PlanBadge
                    letter={sequenceLetter(i)}
                    color={p.color}
                    className="size-9 text-base"
                  />
                  <span>
                    <span className="block font-bold">{p.name}</span>
                    <span className="block text-sm text-fg-muted">{p.focus}</span>
                  </span>
                </h3>
                <ul className="space-y-1 pl-12 text-sm">
                  {p.exercises.map(([id, sets, min, max]) => (
                    <li key={id} className="flex justify-between gap-3">
                      <span className="truncate">{EXERCISE_NAMES_PT_BR[id]?.name ?? id}</span>
                      <span className="shrink-0 text-fg-muted tabular">
                        {sets} × {min}–{max}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Sheet>
    </>
  )
}
