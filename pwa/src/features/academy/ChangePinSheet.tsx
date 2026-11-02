import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, changePin } from '@/data/sync'
import { pinProblem } from '@/domain/academy'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'
import { Sheet } from '@/ui/components/Sheet'

const pinProps = {
  type: 'password',
  inputMode: 'numeric',
  maxLength: 6,
  autoComplete: 'off',
} as const

export function ChangePinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const close = () => {
    setCurrent('')
    setPin('')
    setConfirmPin('')
    setErrors({})
    onClose()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = pinProblem(pin)
    if (problem) return setErrors({ pin: problem })
    if (pin !== confirmPin) return setErrors({ confirm: 'Os PINs não são iguais.' })
    setBusy(true)
    try {
      await changePin(current, pin)
      toast('PIN alterado.', { tone: 'success' })
      close()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          current: error.fields.currentPin ?? '',
          pin: error.fields.pin ?? '',
          form: Object.keys(error.fields).length ? '' : error.message,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const digits = (fn: (v: string) => void) => (e: { target: { value: string } }) =>
    fn(e.target.value.replace(/\D/g, ''))

  return (
    <Sheet open={open} onClose={close} title="Trocar PIN">
      <form id="change-pin" onSubmit={(e) => void submit(e)} className="space-y-4 py-2" noValidate>
        {errors.form && <p className="text-danger">{errors.form}</p>}
        <TextField
          label="PIN atual"
          {...pinProps}
          value={current}
          onChange={digits(setCurrent)}
          error={errors.current || undefined}
        />
        <TextField
          label="Novo PIN"
          {...pinProps}
          value={pin}
          onChange={digits(setPin)}
          error={errors.pin || undefined}
        />
        <TextField
          label="Repita o novo PIN"
          {...pinProps}
          value={confirmPin}
          onChange={digits(setConfirmPin)}
          error={errors.confirm || undefined}
        />
        <Button type="submit" size="lg" block disabled={busy || current.length < 4}>
          {busy ? 'Salvando...' : 'Salvar novo PIN'}
        </Button>
      </form>
    </Sheet>
  )
}
