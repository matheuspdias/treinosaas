import { AlertTriangle, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import { useCatalog } from '@/catalog/useCatalog'
import { formatClock } from '@/domain/duration'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'
import { PageSpinner } from '@/ui/components/Spinner'
import { importSharedPlan } from './shareActions'
import { decodeSharedPlan } from './shareCodec'
import type { DecodeResult } from './shareCodec'

/** Destino do link/QR de ficha compartilhada: /importar#<código>. */
export function ImportPlanPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const catalog = useCatalog()
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void decodeSharedPlan(hash.replace(/^#/, '')).then((r) => alive && setResult(r))
    return () => {
      alive = false
    }
  }, [hash])

  if (!result || !catalog) return <PageSpinner />
  if (!result.ok) {
    return (
      <>
        <PageHeader back="/" title="Importar ficha" />
        <EmptyState
          icon={<AlertTriangle className="size-8" />}
          title="Link inválido"
          description={result.error}
          action={
            <Link to="/" className={buttonClass({ block: true })}>
              Ir para o início
            </Link>
          }
        />
      </>
    )
  }

  const shared = result.plan
  const catalogNames = new Map(catalog.map((e) => [e.ref.id, e.name]))
  const customNames = new Map((shared.x ?? []).map((x) => [x.i, x.n]))
  const nameOf = (source: string, id: string) =>
    (source === 'custom'
      ? customNames.get(id)
      : (catalogNames.get(id) ?? EXERCISE_NAMES_PT_BR[id]?.name)) ?? 'Exercício desconhecido'

  const add = async () => {
    setBusy(true)
    try {
      const plan = await importSharedPlan(shared)
      toast(`"${plan.name}" adicionada às suas fichas.`, { tone: 'success' })
      navigate(`/fichas/${plan.id}`, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-32">
      <PageHeader back="/" title="Ficha compartilhada" subtitle="Confira antes de adicionar" />
      <div className="space-y-4 px-4">
        <Card className="flex items-center gap-4 p-4">
          <PlanBadge
            letter={(shared.n.trim().split(/\s+/).at(-1)?.[0] ?? 'A').toUpperCase()}
            color={shared.c}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-2xl font-extrabold">{shared.n}</p>
            <p className="text-sm text-fg-muted">
              {shared.e.length} exercícios · {shared.e.reduce((n, e) => n + e[2], 0)} séries
            </p>
          </div>
        </Card>
        <Card>
          <ol className="divide-y divide-border">
            {shared.e.map(([source, id, sets, min, max, , rest, , notes], i) => (
              <li key={`${id}-${i}`} className="flex items-start gap-3 px-4 py-3">
                <span className="w-6 pt-0.5 text-sm font-bold text-fg-subtle tabular">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{nameOf(source, id)}</span>
                  <span className="block text-sm text-fg-muted tabular">
                    {sets} × {min === max ? min : `${min}–${max}`} · descanso {formatClock(rest)}
                  </span>
                  {notes && <span className="block text-sm text-fg-subtle">{notes}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Card>
        {(shared.x?.length ?? 0) > 0 && (
          <p className="text-sm text-fg-muted">
            Inclui {shared.x!.length} exercício(s) personalizado(s), que serão criados na sua
            biblioteca (sem fotos ou vídeos próprios).
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 safe-bottom backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Button
            size="lg"
            block
            icon={<Download className="size-5" />}
            disabled={busy}
            onClick={() => void add()}
          >
            Adicionar às minhas fichas
          </Button>
        </div>
      </div>
    </div>
  )
}
