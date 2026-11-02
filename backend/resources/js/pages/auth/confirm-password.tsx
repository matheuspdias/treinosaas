import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'

export default function ConfirmPassword() {
  const form = useForm({ password: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/confirm-password', { onFinish: () => form.reset('password') })
  }

  return (
    <AuthLayout
      title="Confirme sua senha"
      description="Área protegida: digite sua senha para continuar."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={form.data.password}
          onChange={(e) => form.setData('password', e.target.value)}
          error={form.errors.password}
        />
        <Button type="submit" block disabled={form.processing}>
          Confirmar
        </Button>
      </form>
    </AuthLayout>
  )
}
