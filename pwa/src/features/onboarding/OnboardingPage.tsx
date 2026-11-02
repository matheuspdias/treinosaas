import {
  CalendarCheck,
  ChevronRight,
  LayoutTemplate,
  PencilLine,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { repos } from '@/data'
import { academyEnabled } from '@/data/sync'
import { applyTemplate, createNextPlan } from '@/features/plans/planActions'
import { toast } from '@/stores/toastStore'
import type { WorkoutTemplate } from '@/templates/templates'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { TemplateList } from './TemplateList'

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Fichas A, B, C…',
    text: 'O app sugere o próximo treino da sequência.',
  },
  {
    icon: TrendingUp,
    title: 'Progressão automática',
    text: 'Mostra quando é hora de subir a carga e comemora seus recordes.',
  },
  { icon: WifiOff, title: 'Funciona offline', text: 'Seus dados ficam no aparelho, sem cadastro.' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'welcome' | 'choose'>('welcome')
  const [busy, setBusy] = useState(false)

  const chooseTemplate = async (t: WorkoutTemplate) => {
    setBusy(true)
    try {
      await applyTemplate(t)
      toast(`Fichas do modelo ${t.name} criadas. Ajuste as cargas no primeiro treino.`, {
        tone: 'success',
        duration: 5000,
      })
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const fromScratch = async () => {
    await repos.settings.update({ onboardingDone: true })
    const plan = await createNextPlan()
    navigate(`/fichas/${plan.id}`, { replace: true })
  }

  const skip = async () => {
    await repos.settings.update({ onboardingDone: true })
    navigate('/', { replace: true })
  }

  if (step === 'welcome') {
    return (
      <div className="flex min-h-dvh flex-col px-6 pt-12 safe-top pb-6 safe-bottom">
        <img src="/favicon.svg" alt="" className="size-20 rounded-[1.25rem] ring-1 ring-border" />
        <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight">
          Seu treino,
          <br />
          <span className="text-accent">no bolso.</span>
        </h1>
        <p className="mt-3 text-lg text-fg-muted">
          Registre séries e cargas em segundos, entre uma série e outra, com uma mão só.
        </p>
        <ul className="mt-8 space-y-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
                aria-hidden
              >
                <Icon className="size-6" />
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="block text-fg-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          <Button size="lg" block onClick={() => setStep('choose')}>
            Começar
            <ChevronRight className="size-5" />
          </Button>
          {academyEnabled && (
            <Button
              variant="ghost"
              size="lg"
              block
              className="mt-2"
              onClick={() => navigate('/academia/entrar')}
            >
              Entrar com minha academia
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 safe-top pb-8 safe-bottom">
      <h1 className="text-3xl font-extrabold tracking-tight">Como quer começar?</h1>
      <p className="mt-1 text-fg-muted">
        Use um modelo pronto e ajuste depois, ou monte suas fichas do zero.
      </p>

      <h2 className="mt-6 mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-fg-muted uppercase">
        <LayoutTemplate className="size-4" aria-hidden />
        Modelos prontos
      </h2>
      <TemplateList onApply={(t) => void chooseTemplate(t)} busy={busy} />

      <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-fg-muted uppercase">
        <PencilLine className="size-4" aria-hidden />
        Do meu jeito
      </h2>
      <button
        type="button"
        onClick={() => void fromScratch()}
        className="block w-full text-left active:opacity-80"
      >
        <Card className="flex items-center gap-3 p-4">
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold">Começar do zero</span>
            <span className="block text-sm text-fg-muted">
              Crie a primeira ficha e escolha os exercícios.
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
        </Card>
      </button>

      <button
        type="button"
        onClick={() => void skip()}
        className="mx-auto mt-6 flex min-h-touch items-center px-4 font-semibold text-fg-muted"
      >
        Pular por enquanto
      </button>
    </div>
  )
}
