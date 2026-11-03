import { useForm } from '@inertiajs/react'
import { Check, Copy, ExternalLink, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { generateIcons, ICON_BACKGROUNDS, readableOn } from '@/lib/appIcon'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { FieldError, FieldLabel, TextField } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { cn } from '@/ui/cn'
import { SettingsNav } from './SettingsNav'

interface Branding {
  name: string
  appName: string | null
  brandColor: string | null
  iconUrl: string | null
  appUrl: string
}

const PRESETS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#f97316',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#111827',
]
/** Cor padrão do app quando a academia não escolhe uma. */
const DEFAULT_COLOR = '#b8f24a'

type Background = 'white' | 'black' | 'brand'

export default function AppBranding({ branding }: { branding: Branding }) {
  const colorId = useId()
  const logoId = useId()
  const [logo, setLogo] = useState<File | null>(null)
  const [background, setBackground] = useState<Background>('white')
  const [preview, setPreview] = useState<string | null>(branding.iconUrl)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const form = useForm<{
    app_name: string
    brand_color: string
    icon: File | null
    maskable_icon: File | null
    remove_icon: boolean
  }>({
    app_name: branding.appName ?? '',
    brand_color: branding.brandColor ?? '',
    icon: null,
    maskable_icon: null,
    remove_icon: false,
  })
  const color = form.data.brand_color || DEFAULT_COLOR
  const bgColor = background === 'brand' ? color : ICON_BACKGROUNDS[background]
  const appName = form.data.app_name.trim() || branding.name

  // Refaz os ícones quando muda o logo, o fundo ou a cor (fundo "cor da academia").
  useEffect(() => {
    if (!logo) return
    let url: string | null = null
    let cancelled = false
    generateIcons(logo, bgColor)
      .then((icons) => {
        url = icons.previewUrl
        if (cancelled) return URL.revokeObjectURL(url)
        setPreview(url)
        form.setData((d) => ({
          ...d,
          icon: icons.icon,
          maskable_icon: icons.maskable,
          remove_icon: false,
        }))
      })
      .catch((e: Error) => setLogoError(e.message))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.setData muda a cada render
  }, [logo, bgColor])

  const pickLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoError(file.size > 5 * 1024 * 1024 ? 'A imagem pode ter no máximo 5 MB.' : null)
    if (file.size <= 5 * 1024 * 1024) setLogo(file)
  }

  const removeIcon = () => {
    setLogo(null)
    setPreview(null)
    form.setData((d) => ({ ...d, icon: null, maskable_icon: null, remove_icon: true }))
  }

  const copy = async () => {
    await navigator.clipboard.writeText(branding.appUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/settings/app', {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => setLogo(null),
    })
  }

  return (
    <PanelLayout title="App do aluno" width="narrow">
      <PageHeader title="Ajustes" />
      <SettingsNav />
      <form onSubmit={submit} className="space-y-4 px-4 pt-2 pb-8 lg:px-6">
        <Card className="p-5">
          <h2 className="font-bold">Link do app</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Envie para os alunos. Ao abrir, o celular oferece instalar o app com o nome e o ícone da
            academia.
          </p>
          <p className="mt-3 rounded-control bg-surface-2 px-3 py-2 font-mono text-sm break-all">
            {branding.appUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              onClick={() => void copy()}
            >
              {copied ? 'Copiado' : 'Copiar link'}
            </Button>
            <a
              href={branding.appUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-4 text-sm font-semibold text-fg-muted active:bg-surface-2"
            >
              <ExternalLink className="size-4" /> Abrir
            </a>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="font-bold">Marca</h2>

          <TextField
            label="Nome do app"
            hint="aparece embaixo do ícone; curto funciona melhor"
            placeholder={branding.name}
            maxLength={30}
            value={form.data.app_name}
            onChange={(e) => form.setData('app_name', e.target.value)}
            error={form.errors.app_name}
          />

          <div>
            <FieldLabel htmlFor={colorId} hint="botões e destaques do app">
              Cor
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  aria-pressed={form.data.brand_color === c}
                  onClick={() => form.setData('brand_color', c)}
                  className={cn(
                    'size-10 rounded-full border-2',
                    form.data.brand_color === c ? 'border-fg' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                id={colorId}
                type="color"
                value={color}
                onChange={(e) => form.setData('brand_color', e.target.value)}
                className="size-10 cursor-pointer rounded-full border border-border bg-transparent"
              />
              {form.data.brand_color && (
                <button
                  type="button"
                  onClick={() => form.setData('brand_color', '')}
                  className="min-h-11 px-2 text-sm font-semibold text-fg-muted"
                >
                  Usar padrão
                </button>
              )}
            </div>
            <FieldError message={form.errors.brand_color} />
          </div>

          <div>
            <FieldLabel htmlFor={logoId} hint="quadrado, de preferência PNG com fundo transparente">
              Logo
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={logoId}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold active:bg-surface-2"
              >
                <ImagePlus className="size-4" /> {preview ? 'Trocar logo' : 'Enviar logo'}
              </label>
              <input
                id={logoId}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={pickLogo}
              />
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  icon={<Trash2 className="size-4" />}
                  onClick={removeIcon}
                >
                  Remover
                </Button>
              )}
            </div>
            <FieldError message={logoError ?? form.errors.icon ?? form.errors.maskable_icon} />
            {logo && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Fundo do ícone</p>
                <SegmentedControl<Background>
                  label="Fundo do ícone"
                  value={background}
                  onChange={setBackground}
                  options={[
                    { value: 'white', label: 'Branco' },
                    { value: 'black', label: 'Preto' },
                    { value: 'brand', label: 'Cor da academia' },
                  ]}
                />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold">Prévia</h2>
          <div className="mt-4 flex items-end gap-6">
            <div className="flex w-20 flex-col items-center gap-1.5">
              {preview ? (
                <img src={preview} alt="" className="size-16 rounded-[22%] shadow-card" />
              ) : (
                <img src="/logo.svg" alt="" className="size-16 rounded-[22%] shadow-card" />
              )}
              <span className="w-full truncate text-center text-xs">{appName}</span>
            </div>
            <span
              className="inline-flex min-h-11 items-center rounded-control px-5 font-bold"
              style={{ backgroundColor: color, color: readableOn(color) }}
            >
              Iniciar treino
            </span>
          </div>
          {!preview && (
            <p className="mt-3 text-sm text-fg-muted">Sem logo, o app usa o ícone padrão.</p>
          )}
        </Card>

        <Button type="submit" size="lg" block disabled={form.processing || !form.isDirty}>
          {form.processing ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </PanelLayout>
  )
}
