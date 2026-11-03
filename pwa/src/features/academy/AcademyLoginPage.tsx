import { Building2, ChevronRight, KeyRound, Phone } from 'lucide-react'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAcademyFeed, useBranding } from '@/data/hooks'
import { ApiError, createPinAndLogin, loginWithPin, lookupPhone } from '@/data/sync'
import { formatPhoneInput, isCompletePhone, pinProblem } from '@/domain/academy'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { TextField } from '@/ui/components/Field'
import { PRIVACY_TEXT } from './strings'

type Step = 'phone' | 'choose' | 'pin' | 'create' | DeadEnd
type DeadEnd = 'blocked' | 'suspended' | 'inactive' | 'not_found'
type Choice = {
  id: string
  name: string
  next: 'login' | 'first_access' | 'blocked' | 'suspended' | 'inactive'
}

const STEP_OF: Record<Choice['next'], Step> = {
  login: 'pin',
  first_access: 'create',
  blocked: 'blocked',
  suspended: 'suspended',
  inactive: 'inactive',
}

/** Telas sem saída: só dá para explicar e tentar outro número. */
const DEAD_ENDS: Record<DeadEnd, { title: string; text: string }> = {
  blocked: {
    title: 'O prazo do primeiro acesso acabou',
    text: 'Por segurança, o PIN só pode ser criado logo depois do cadastro. Peça na recepção para liberar seu acesso e tente de novo.',
  },
  suspended: {
    title: 'Acesso da academia suspenso',
    text: 'O acesso dos alunos desta academia está suspenso no momento. Fale com o dono ou a recepção da academia.',
  },
  inactive: {
    title: 'Cadastro inativo',
    text: 'Seu cadastro nesta academia está inativo. Fale com a recepção para reativar.',
  },
  not_found: {
    title: 'Celular não encontrado',
    text: 'Confira o número ou peça para a recepção fazer seu cadastro nesta academia.',
  },
}

const isDeadEnd = (step: Step): step is DeadEnd => step in DEAD_ENDS

const pinInputProps = {
  type: 'password',
  inputMode: 'numeric',
  autoComplete: 'off',
  maxLength: 6,
  pattern: '[0-9]*',
} as const

/** Entrar com o celular cadastrado pela academia + PIN (criado no primeiro acesso). */
export function AcademyLoginPage() {
  const navigate = useNavigate()
  const feed = useAcademyFeed()
  const branding = useBranding()
  const brand = branding.status === 'ready' ? branding.branding : null
  const privacyId = useId()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [academyId, setAcademyId] = useState<string | undefined>()
  const [choices, setChoices] = useState<Choice[]>([])
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const fail = (error: unknown) => {
    if (error instanceof ApiError) {
      setErrors(Object.keys(error.fields).length > 0 ? error.fields : { form: error.message })
    } else {
      setErrors({ form: 'Algo deu errado. Tente de novo.' })
    }
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setErrors({})
    try {
      await fn()
    } catch (error) {
      fail(error)
    } finally {
      setBusy(false)
    }
  }

  const submitPhone = (e: FormEvent) => {
    e.preventDefault()
    if (!isCompletePhone(phone)) {
      setErrors({ phone: 'Informe o celular com DDD, por exemplo (11) 91234-5678.' })
      return
    }
    void run(async () => {
      const result = await lookupPhone(phone)
      setPin('')
      setPinConfirm('')
      if (result.next === 'choose_academy') {
        setChoices(result.academies)
        setStep('choose')
      } else {
        setAcademyId(undefined)
        setStep(
          result.next === 'login' ? 'pin' : result.next === 'first_access' ? 'create' : result.next,
        )
      }
    })
  }

  const done = async (studentName: string) => {
    toast(`Olá, ${studentName.split(' ')[0]}! Seus treinos da academia estão chegando.`, {
      tone: 'success',
    })
    navigate('/fichas', { replace: true })
  }

  const submitPin = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const session = await loginWithPin({ phone, pin, academyId })
      await done(session.student.name)
    })
  }

  const submitCreate = (e: FormEvent) => {
    e.preventDefault()
    const problem = pinProblem(pin)
    if (problem) return setErrors({ pin: problem })
    if (pin !== pinConfirm) return setErrors({ pinConfirm: 'Os PINs não são iguais.' })
    if (!privacy)
      return setErrors({ acceptPrivacy: 'Para continuar, aceite o aviso de privacidade.' })
    void run(async () => {
      const session = await createPinAndLogin({ phone, pin, academyId })
      await done(session.student.name)
    })
  }

  const restart = () => {
    setStep('phone')
    setErrors({})
  }

  return (
    <div className="min-h-dvh pb-8 safe-bottom">
      {/* safe-top substitui o padding-top: o espaço extra fica num div interno. */}
      <header className="safe-top">
        <div className="flex flex-col items-center px-4 pt-10 pb-6 text-center">
          {brand?.iconUrl ? (
            <img src={brand.iconUrl} alt="" className="size-20 rounded-[22%] shadow-card" />
          ) : (
            <span
              className="flex size-20 items-center justify-center rounded-[22%] bg-accent-soft text-accent"
              aria-hidden
            >
              <Building2 className="size-10" />
            </span>
          )}
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{brand?.name ?? 'Entrar'}</h1>
          <p className="text-fg-muted">Entre para ver seus treinos</p>
        </div>
      </header>
      <div className="px-4">
        {step === 'phone' && feed.lastError && !errors.form && (
          <p role="status" className="mb-4 rounded-control bg-warning-soft px-4 py-3">
            {feed.lastError}
          </p>
        )}
        {errors.form && (
          <p role="alert" className="mb-4 rounded-control bg-danger-soft px-4 py-3 text-danger">
            {errors.form}
          </p>
        )}

        {step === 'phone' && (
          <form onSubmit={submitPhone} className="space-y-5" noValidate>
            <p className="text-fg-muted">Use o celular que você informou na recepção.</p>
            <TextField
              label="Celular com DDD"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(11) 91234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              error={errors.phone}
              autoFocus
            />
            <Button
              type="submit"
              size="lg"
              block
              disabled={busy}
              icon={<Phone className="size-5" />}
            >
              {busy ? 'Procurando...' : 'Continuar'}
            </Button>
          </form>
        )}

        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-fg-muted">Seu celular está em mais de uma academia. Qual delas?</p>
            {choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className="block w-full text-left active:opacity-80"
                onClick={() => {
                  setAcademyId(c.id)
                  setStep(STEP_OF[c.next])
                }}
              >
                <Card className="flex min-h-touch items-center gap-3 p-4">
                  <Building2 className="size-5 text-accent" aria-hidden />
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
                </Card>
              </button>
            ))}
          </div>
        )}

        {step === 'pin' && (
          <form onSubmit={submitPin} className="space-y-5" noValidate>
            <p className="text-fg-muted">
              Celular <strong className="text-fg">{phone}</strong>. Digite seu PIN.
            </p>
            <TextField
              label="PIN"
              {...pinInputProps}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              error={errors.pin ?? errors.phone}
              autoFocus
            />
            <Button
              type="submit"
              size="lg"
              block
              disabled={busy || pin.length < 4}
              icon={<KeyRound className="size-5" />}
            >
              {busy ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-fg-muted">
              Esqueceu o PIN? Peça na recepção para liberar um novo primeiro acesso.
            </p>
          </form>
        )}

        {step === 'create' && (
          <form onSubmit={submitCreate} className="space-y-5" noValidate>
            <p className="text-fg-muted">
              Primeiro acesso: crie um PIN de 4 a 6 números. Você vai usar ele para entrar em outro
              aparelho.
            </p>
            <TextField
              label="Crie seu PIN"
              {...pinInputProps}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              error={errors.pin ?? errors.phone}
              autoFocus
            />
            <TextField
              label="Repita o PIN"
              {...pinInputProps}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
              error={errors.pinConfirm}
            />
            <Card className="p-4">
              <p className="text-sm font-semibold">Aviso de privacidade</p>
              <p className="mt-1 text-sm text-fg-muted">{PRIVACY_TEXT}</p>
              <div className="mt-3 flex min-h-touch items-center gap-3">
                <input
                  id={privacyId}
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="size-6 shrink-0 accent-[var(--c-accent)]"
                  aria-invalid={!!errors.acceptPrivacy}
                />
                <label htmlFor={privacyId} className="font-medium">
                  Li e concordo
                </label>
              </div>
              {errors.acceptPrivacy && (
                <p className="mt-1 text-sm text-danger">{errors.acceptPrivacy}</p>
              )}
            </Card>
            <Button type="submit" size="lg" block disabled={busy}>
              {busy ? 'Criando...' : 'Criar PIN e entrar'}
            </Button>
          </form>
        )}

        {isDeadEnd(step) && (
          <div className="space-y-5">
            <Card className="p-5" role="alert">
              <p className="text-lg font-bold">{DEAD_ENDS[step].title}</p>
              <p className="mt-1 text-fg-muted">{DEAD_ENDS[step].text}</p>
            </Card>
            <Button variant="secondary" size="lg" block onClick={restart}>
              Tentar outro número
            </Button>
          </div>
        )}

        {step !== 'phone' && !isDeadEnd(step) && (
          <button
            type="button"
            onClick={restart}
            className="mx-auto mt-6 flex min-h-touch items-center px-4 font-semibold text-fg-muted"
          >
            Usar outro celular
          </button>
        )}
      </div>
    </div>
  )
}
