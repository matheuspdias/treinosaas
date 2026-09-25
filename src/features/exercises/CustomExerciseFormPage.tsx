import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { EQUIPMENT_PT_BR, MUSCLE_PT_BR } from '@/catalog/i18n/pt-BR'
import { repos } from '@/data'
import { useCustomExercise } from '@/data/hooks'
import { EQUIPMENT, MUSCLES } from '@/domain/types'
import type { CustomExercise, CustomMedia, Equipment, Muscle } from '@/domain/types'
import { compressImage, videoDuration } from '@/lib/imageCompression'
import { parseYouTubeId } from '@/media/youtube'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { Chip } from '@/ui/components/Chip'
import { TextArea, TextField } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { PageSpinner } from '@/ui/components/Spinner'
import { ExerciseMediaView } from './components/ExerciseMediaView'

const MAX_GIF_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 30 * 1024 * 1024
const MAX_VIDEO_SECONDS = 60

type MediaDraft =
  | { kind: 'keep' }
  | { kind: 'none' }
  | { kind: 'file'; blob: Blob; mediaType: 'image' | 'gif' | 'video'; previewUrl: string }
  | { kind: 'youtube'; url: string }

type MediaTab = 'none' | 'file' | 'youtube'

async function prepareFile(file: File): Promise<Extract<MediaDraft, { kind: 'file' }>> {
  if (file.type === 'image/gif') {
    if (file.size > MAX_GIF_BYTES) throw new Error('GIF muito grande (máximo 8 MB).')
    return { kind: 'file', blob: file, mediaType: 'gif', previewUrl: URL.createObjectURL(file) }
  }
  if (file.type.startsWith('image/')) {
    const blob = await compressImage(file)
    return { kind: 'file', blob, mediaType: 'image', previewUrl: URL.createObjectURL(blob) }
  }
  if (file.type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error('Vídeo muito grande (máximo 30 MB).')
    const duration = await videoDuration(file).catch(() => 0)
    if (duration > MAX_VIDEO_SECONDS) throw new Error('Vídeo muito longo (máximo 60 segundos).')
    return { kind: 'file', blob: file, mediaType: 'video', previewUrl: URL.createObjectURL(file) }
  }
  throw new Error('Formato não suportado. Use foto, GIF ou vídeo.')
}

export function CustomExerciseFormPage() {
  const { id } = useParams()
  const existing = useCustomExercise(id)
  if (id && existing === undefined) return <PageSpinner />
  return <Form key={existing?.id ?? 'new'} existing={existing ?? null} />
}

function Form({ existing }: { existing: CustomExercise | null }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('voltar')
  const [name, setName] = useState(existing?.name ?? '')
  const [muscles, setMuscles] = useState<Muscle[]>(existing?.primaryMuscles ?? [])
  const [equipment, setEquipment] = useState<Equipment | null>(existing?.equipment ?? null)
  const [instructions, setInstructions] = useState(existing?.instructions ?? '')
  const [media, setMedia] = useState<MediaDraft>(
    existing?.media ? { kind: 'keep' } : { kind: 'none' },
  )
  const [tab, setTab] = useState<MediaTab>(
    existing?.media?.kind === 'youtube' ? 'youtube' : existing?.media ? 'file' : 'none',
  )
  const [youtubeUrl, setYoutubeUrl] = useState(
    existing?.media?.kind === 'youtube' ? `https://youtu.be/${existing.media.videoId}` : '',
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const previewUrl = media.kind === 'file' ? media.previewUrl : null
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      setMedia(await prepareFile(file))
      setErrors((e) => ({ ...e, media: '' }))
    } catch (err) {
      setErrors((e) => ({
        ...e,
        media: err instanceof Error ? err.message : 'Não foi possível ler o arquivo.',
      }))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Dê um nome ao exercício.'
    if (muscles.length === 0) next.muscles = 'Escolha pelo menos um grupo muscular.'
    const youtubeId = tab === 'youtube' ? parseYouTubeId(youtubeUrl) : null
    if (tab === 'youtube' && !youtubeId) next.youtube = 'Link do YouTube inválido.'
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setBusy(true)
    try {
      const now = new Date().toISOString()
      const oldBlobId = existing?.media?.kind === 'blob' ? existing.media.blobId : null
      let finalMedia: CustomMedia | undefined = existing?.media
      if (tab === 'none') finalMedia = undefined
      else if (tab === 'youtube') finalMedia = { kind: 'youtube', videoId: youtubeId! }
      else if (media.kind === 'file') {
        const blobId = await repos.media.put(media.blob, media.blob.type)
        finalMedia = { kind: 'blob', blobId, mediaType: media.mediaType, mimeType: media.blob.type }
      } else if (media.kind === 'none' || existing?.media?.kind !== 'blob') finalMedia = undefined

      const exercise: CustomExercise = {
        id: existing?.id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        name: name.trim(),
        primaryMuscles: muscles,
        secondaryMuscles: existing?.secondaryMuscles ?? [],
        equipment,
        instructions: instructions.trim(),
        ...(finalMedia ? { media: finalMedia } : {}),
      }
      await repos.customExercises.save(exercise)
      const newBlobId = finalMedia?.kind === 'blob' ? finalMedia.blobId : null
      if (oldBlobId && oldBlobId !== newBlobId) await repos.media.remove(oldBlobId)

      toast(existing ? 'Exercício atualizado.' : 'Exercício criado.', { tone: 'success' })
      if (returnTo?.startsWith('/')) navigate(returnTo, { replace: true })
      else navigate(`/exercicios/custom/${exercise.id}`, { replace: true })
    } catch {
      toast('Não foi possível salvar. Verifique o espaço disponível no aparelho.', {
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader back title={existing ? 'Editar exercício' : 'Novo exercício'} />
      <form onSubmit={submit} className="space-y-6 px-4 pb-10" noValidate>
        <TextField
          label="Nome"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Ex.: Remada na máquina X"
          autoFocus={!existing}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg-muted">Grupos musculares</legend>
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <Chip
                key={m}
                selected={muscles.includes(m)}
                onClick={() =>
                  setMuscles((list) =>
                    list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
                  )
                }
              >
                {MUSCLE_PT_BR[m]}
              </Chip>
            ))}
          </div>
          {errors.muscles && <p className="mt-2 text-sm text-danger">{errors.muscles}</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg-muted">Equipamento</legend>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((eq) => (
              <Chip
                key={eq}
                selected={equipment === eq}
                onClick={() => setEquipment(equipment === eq ? null : eq)}
              >
                {EQUIPMENT_PT_BR[eq]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold text-fg-muted">Mídia</legend>
          <SegmentedControl<MediaTab>
            label="Tipo de mídia"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'none', label: 'Nenhuma' },
              { value: 'file', label: 'Foto / vídeo' },
              { value: 'youtube', label: 'YouTube' },
            ]}
          />
          {tab === 'file' && (
            <div className="space-y-3">
              {media.kind === 'file' ? (
                media.mediaType === 'video' ? (
                  <video
                    src={media.previewUrl}
                    className="aspect-[4/3] w-full rounded-card bg-black object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={media.previewUrl}
                    alt="Pré-visualização"
                    className="aspect-[4/3] w-full rounded-card bg-white object-contain"
                  />
                )
              ) : media.kind === 'keep' && existing?.media?.kind === 'blob' ? (
                <ExerciseMediaView
                  exRef={{ source: 'custom', id: existing.id }}
                  name={existing.name}
                />
              ) : null}
              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  icon={<ImagePlus className="size-5" />}
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                >
                  {media.kind === 'file' ||
                  (media.kind === 'keep' && existing?.media?.kind === 'blob')
                    ? 'Trocar arquivo'
                    : 'Escolher arquivo'}
                </Button>
                {(media.kind === 'file' ||
                  (media.kind === 'keep' && existing?.media?.kind === 'blob')) && (
                  <Button
                    variant="danger"
                    aria-label="Remover mídia"
                    icon={<Trash2 className="size-5" />}
                    onClick={() => setMedia({ kind: 'none' })}
                  />
                )}
              </div>
              <p className="text-sm text-fg-subtle">
                Fotos são comprimidas automaticamente. GIF até 8 MB; vídeo até 60 s e 30 MB.
              </p>
            </div>
          )}
          {tab === 'youtube' && (
            <TextField
              label="Link do YouTube"
              type="url"
              inputMode="url"
              placeholder="https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              error={errors.youtube}
              hint="Precisa de internet para assistir"
            />
          )}
          {errors.media && <p className="text-sm text-danger">{errors.media}</p>}
        </fieldset>

        <TextArea
          label="Como executar (opcional)"
          value={instructions}
          maxLength={1000}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Uma instrução por linha"
        />

        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? 'Salvando…' : existing ? 'Salvar alterações' : 'Criar exercício'}
        </Button>
      </form>
    </>
  )
}
