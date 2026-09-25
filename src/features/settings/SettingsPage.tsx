import { CloudDownload, Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useCatalog } from '@/catalog/useCatalog'
import { repos } from '@/data'
import { exportBackup, importBackup, parseBackup } from '@/data/backup'
import { useSettings } from '@/data/hooks'
import type { Settings, ThemePreference } from '@/domain/types'
import { formatClock } from '@/domain/duration'
import { formatNumber, fromDisplayUnit, toDisplayUnit, UNIT_LABEL } from '@/domain/units'
import { useWorkoutStore } from '@/features/workout/workoutStore'
import { cachedImageCount, precacheUrls, requestPersistentStorage } from '@/lib/imageCache'
import { notificationPermission, requestNotificationPermission } from '@/lib/notifications'
import { catalogImageUrl } from '@/media/catalogProvider'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { PageHeader } from '@/ui/components/PageHeader'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { Stepper } from '@/ui/components/Stepper'
import { Switch } from '@/ui/components/Switch'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 px-1 text-sm font-semibold tracking-wide text-fg-muted uppercase">
        {title}
      </h2>
      <Card className="p-4">{children}</Card>
    </section>
  )
}

const update = (patch: Partial<Settings>) => void repos.settings.update(patch)

function OfflineImages() {
  const catalog = useCatalog()
  const [cached, setCached] = useState<number | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const total = catalog?.reduce((n, e) => n + e.imageCount, 0) ?? 0

  useEffect(() => {
    void cachedImageCount().then(setCached)
  }, [])

  const download = async () => {
    if (!catalog) return
    void requestPersistentStorage()
    const urls = catalog.flatMap((e) =>
      Array.from({ length: e.imageCount }, (_, i) => catalogImageUrl(e.ref.id, i as 0 | 1)),
    )
    const failed = await precacheUrls(urls, (done, t) => setProgress({ done, total: t }))
    setProgress(null)
    setCached(await cachedImageCount())
    if (failed > 0)
      toast(`${failed} imagens não baixaram. Verifique a conexão e tente de novo.`, {
        tone: 'error',
      })
    else toast('Biblioteca completa disponível offline.', { tone: 'success' })
  }

  const complete = cached !== null && total > 0 && cached >= total
  return (
    <div className="space-y-3">
      <p className="text-fg-muted">
        As imagens dos exercícios das suas fichas ficam salvas automaticamente. Baixe a biblioteca
        inteira para navegar por todos os exercícios sem internet.
      </p>
      <p className="text-sm font-semibold tabular" aria-live="polite">
        {progress
          ? `Baixando ${progress.done} de ${progress.total}…`
          : cached === null
            ? ''
            : `${formatNumber(Math.min(cached, total))} de ${formatNumber(total)} imagens salvas`}
      </p>
      {progress && (
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div
            className="h-full bg-accent transition-[width]"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
      <Button
        variant="secondary"
        block
        icon={<CloudDownload className="size-5" />}
        disabled={!!progress || complete || !catalog}
        onClick={() => void download()}
      >
        {complete ? 'Biblioteca completa salva' : 'Baixar biblioteca completa (~22 MB)'}
      </Button>
    </div>
  )
}

function Backup() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const doExport = async () => {
    setBusy(true)
    try {
      const backup = await exportBackup()
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `treinoapp-backup-${backup.exportedAt.slice(0, 10)}.json`
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast('Backup exportado.', { tone: 'success' })
    } catch {
      toast('Não foi possível exportar o backup.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const result = parseBackup(await file.text())
      if (!result.ok) {
        toast(result.error, { tone: 'error', duration: 6000 })
        return
      }
      const { summary } = result
      const ok = await confirm({
        title: 'Substituir todos os dados?',
        description: (
          <>
            O backup de{' '}
            <strong>
              {new Date(summary.exportedAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </strong>{' '}
            tem {summary.plans} fichas, {summary.sessions} treinos e {summary.customExercises}{' '}
            exercícios personalizados. <strong>Tudo o que está no app agora será apagado.</strong>
          </>
        ),
        confirmLabel: 'Substituir dados',
        tone: 'danger',
      })
      if (!ok) return
      await importBackup(result.backup)
      useWorkoutStore.getState().clear()
      toast('Backup importado.', { tone: 'success' })
    } catch {
      toast('Não foi possível importar o backup.', { tone: 'error' })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-fg-muted">
        Seus dados ficam só neste aparelho. Exporte um backup de vez em quando e guarde no Drive ou
        no e-mail.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          icon={<Download className="size-5" />}
          disabled={busy}
          onClick={() => void doExport()}
        >
          Exportar
        </Button>
        <Button
          variant="secondary"
          icon={<Upload className="size-5" />}
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          Importar
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void doImport(e.target.files?.[0])}
      />
    </div>
  )
}

export function SettingsPage() {
  const settings = useSettings()
  const [permission, setPermission] = useState(notificationPermission)
  const unit = settings.weightUnit
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="px-4 pb-8">
        <Section title="Aparência">
          <SegmentedControl<ThemePreference>
            label="Tema"
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            options={[
              {
                value: 'system',
                label: (
                  <>
                    <Monitor className="size-4" aria-hidden /> Sistema
                  </>
                ),
              },
              {
                value: 'light',
                label: (
                  <>
                    <Sun className="size-4" aria-hidden /> Claro
                  </>
                ),
              },
              {
                value: 'dark',
                label: (
                  <>
                    <Moon className="size-4" aria-hidden /> Escuro
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section title="Treino">
          <div className="space-y-5">
            <p className="text-sm text-fg-muted">
              Valores usados ao adicionar exercícios novos a uma ficha.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Stepper
                label="Descanso padrão"
                suffix="s"
                hint={formatClock(settings.defaultRestSec)}
                value={settings.defaultRestSec}
                step={15}
                max={600}
                onChange={(defaultRestSec) => update({ defaultRestSec })}
              />
              <Stepper
                label="Incremento padrão"
                suffix={UNIT_LABEL[unit]}
                maxFractionDigits={2}
                step={0.5}
                max={50}
                value={Math.round(toDisplayUnit(settings.defaultIncrementKg, unit) * 100) / 100}
                onChange={(v) => update({ defaultIncrementKg: fromDisplayUnit(v, unit) })}
              />
            </div>
          </div>
          <div className="mt-4 divide-y divide-border border-t border-border">
            <Switch
              label="Som no fim do descanso"
              checked={settings.restSound}
              onChange={(restSound) => update({ restSound })}
            />
            <Switch
              label="Vibrar no fim do descanso"
              description={
                canVibrate
                  ? undefined
                  : 'Este aparelho não permite vibração pelo navegador (ex.: iPhone).'
              }
              checked={settings.restVibration && canVibrate}
              disabled={!canVibrate}
              onChange={(restVibration) => update({ restVibration })}
            />
            <Switch
              label="Notificar com o app em segundo plano"
              description={
                permission === 'denied'
                  ? 'Notificações bloqueadas. Libere nas configurações do navegador.'
                  : permission === 'unsupported'
                    ? 'Este navegador não suporta notificações. No iPhone, instale o app na tela de início.'
                    : undefined
              }
              checked={settings.restNotification && permission === 'granted'}
              disabled={permission === 'denied' || permission === 'unsupported'}
              onChange={async (on) => {
                if (on) {
                  const result = await requestNotificationPermission()
                  setPermission(result)
                  if (result !== 'granted') return
                }
                update({ restNotification: on })
              }}
            />
          </div>
        </Section>

        <Section title="Uso offline">
          <OfflineImages />
        </Section>

        <Section title="Backup">
          <Backup />
        </Section>

        <section className="px-1 text-sm text-fg-subtle">
          <p>TreinoApp v{__APP_VERSION__}</p>
          <p className="mt-1">
            Exercícios e imagens:{' '}
            <a
              className="underline"
              href="https://github.com/yuhonas/free-exercise-db"
              target="_blank"
              rel="noreferrer"
            >
              free-exercise-db
            </a>{' '}
            (domínio público).
          </p>
        </section>
      </div>
    </>
  )
}
