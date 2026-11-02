import { Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'

export default function ForgotPassword({ status }: { status?: string }) {
  const form = useForm({ email: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/forgot-password')
  }

  return (
    <AuthLayout
      title="Esqueci a senha"
      description="Enviamos um link para você criar uma senha nova."
    >
      {status && <p className="mb-4 rounded-control bg-accent-soft p-3 text-sm">{status}</p>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={form.data.email}
          onChange={(e) => form.setData('email', e.target.value)}
          error={form.errors.email}
        />
        <Button type="submit" block disabled={form.processing}>
          Enviar link
        </Button>
        <Link href="/login" className="text-center font-semibold text-fg-muted">
          Voltar para o login
        </Link>
      </form>
    </AuthLayout>
  )
}
