import { Copy, Image, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCustomExercises } from '@/data/hooks'
import type { Plan, WeightUnit } from '@/domain/types'
import { formatWeight } from '@/domain/units'
import { useExerciseLookup } from '@/features/exercises/hooks/useExerciseLookup'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { Sheet } from '@/ui/components/Sheet'
import { Switch } from '@/ui/components/Switch'
import { renderPlanImage, shareOrDownload } from './planImage'
import { QrCode } from './QrCode'
import { encodeSharedPlan, shareUrl, toSharedPlan } from './shareCodec'

interface Props {
  plan: Plan
  letter: string
  unit: WeightUnit
  open: boolean
  onClose: () => void
}

export function SharePlanSheet({ plan, letter, unit, open, onClose }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Compartilhar ${plan.name}`}
      description="Quem abrir o link ou ler o QR code pode importar a ficha no próprio app."
    >
      {open && <Body plan={plan} letter={letter} unit={unit} />}
    </Sheet>
  )
}

function Body({ plan, letter, unit }: Omit<Props, 'open' | 'onClose'>) {
  const customs = useCustomExercises()
  const lookup = useExerciseLookup()
  const [includeLoads, setIncludeLoads] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [busyImage, setBusyImage] = useState(false)

  useEffect(() => {
    if (!customs) return
    let alive = true
    void encodeSharedPlan(toSharedPlan(plan, customs, { includeLoads })).then(
      (code) => alive && setUrl(shareUrl(code)),
    )
    return () => {
      alive = false
    }
  }, [plan, customs, includeLoads])

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copiado.', { tone: 'success' })
    } catch {
      toast('Não foi possível copiar. Use o botão compartilhar.', { tone: 'error' })
    }
  }

  const shareLink = async () => {
    if (!url) return
    try {
      await navigator.share({ title: plan.name, text: `Ficha "${plan.name}" no TreinoApp`, url })
    } catch {
      // cancelado pelo usuário
    }
  }

  const saveImage = async () => {
    setBusyImage(true)
    try {
      const blob = await renderPlanImage({
        letter,
        name: plan.name,
        color: plan.color,
        subtitle: `${plan.exercises.length} exercícios · ${plan.exercises.reduce((n, e) => n + e.sets, 0)} séries`,
        rows: plan.exercises.map((e) => ({
          name: lookup.name(e.exercise),
          scheme: `${e.sets} × ${e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}`,
          ...(includeLoads && e.loadKg > 0
            ? { detail: formatWeight(e.loadKg, unit) + (e.notes ? ` · ${e.notes}` : '') }
            : e.notes
              ? { detail: e.notes }
              : {}),
        })),
      })
      const slug = plan.name
        .normalize('NFD')
        .replace(/[^\w]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      const result = await shareOrDownload(blob, `ficha-${slug || 'treino'}.png`, plan.name)
      if (result === 'downloaded') toast('Imagem salva.', { tone: 'success' })
    } catch {
      toast('Não foi possível gerar a imagem.', { tone: 'error' })
    } finally {
      setBusyImage(false)
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="space-y-4 pt-2 pb-2">
      <div className="mx-auto w-full max-w-64 overflow-hidden rounded-card bg-white p-2">
        {url ? (
          <QrCode
            value={url}
            label={`QR code para importar a ficha ${plan.name}`}
            className="block aspect-square w-full"
          />
        ) : (
          <div className="aspect-square" />
        )}
      </div>
      <Switch
        label="Incluir minhas cargas"
        description="Sem isso, a pessoa recebe a ficha com carga zero."
        checked={includeLoads}
        onChange={setIncludeLoads}
      />
      <div className="grid gap-2">
        {canShare && (
          <Button
            size="lg"
            icon={<Share2 className="size-5" />}
            disabled={!url}
            onClick={() => void shareLink()}
          >
            Enviar link
          </Button>
        )}
        <Button
          variant={canShare ? 'secondary' : 'primary'}
          size={canShare ? 'md' : 'lg'}
          icon={<Copy className="size-5" />}
          disabled={!url}
          onClick={() => void copy()}
        >
          Copiar link
        </Button>
        <Button
          variant="secondary"
          icon={<Image className="size-5" />}
          disabled={busyImage || !lookup.ready}
          onClick={() => void saveImage()}
        >
          {busyImage ? 'Gerando imagem…' : 'Imagem para WhatsApp / Instagram'}
        </Button>
      </div>
    </div>
  )
}
