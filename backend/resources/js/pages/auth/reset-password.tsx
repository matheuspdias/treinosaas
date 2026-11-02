import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'

export default function ResetPassword({ token, email }: { token: string; email: string }) {
  const form = useForm({ token, email, password: '', password_confirmation: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/reset-password', {
      onFinish: () => form.reset('password', 'password_confirmation'),
    })
  }

  return (
    <AuthLayout title="Nova senha">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          value={form.data.email}
          readOnly
          error={form.errors.email}
        />
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          value={form.data.password}
          onChange={(e) => form.setData('password', e.target.value)}
          error={form.errors.password}
        />
        <TextField
          label="Repita a senha"
          type="password"
          autoComplete="new-password"
          required
          value={form.data.password_confirmation}
          onChange={(e) => form.setData('password_confirmation', e.target.value)}
          error={form.errors.password_confirmation}
        />
        <Button type="submit" block disabled={form.processing}>
          Salvar senha
        </Button>
      </form>
    </AuthLayout>
  )
}
