import { Link, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/ui/components/Button'
import { TextField } from '@/ui/components/Field'

export default function Login({
  status,
  canResetPassword,
}: {
  status?: string
  canResetPassword: boolean
}) {
  const form = useForm({ email: '', password: '', remember: true })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/login', { onFinish: () => form.reset('password') })
  }

  return (
    <AuthLayout title="Entrar" description="Acesso da equipe da academia.">
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
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={form.data.password}
          onChange={(e) => form.setData('password', e.target.value)}
          error={form.errors.password}
        />
        {canResetPassword && (
          <Link
            href="/forgot-password"
            className="-mt-2 self-end text-sm font-semibold text-fg-muted underline-offset-4 hover:underline"
          >
            Esqueci a senha
          </Link>
        )}
        <label className="flex min-h-touch items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-[var(--c-accent)]"
            checked={form.data.remember}
            onChange={(e) => form.setData('remember', e.target.checked)}
          />
          Manter conectado neste aparelho
        </label>
        <Button type="submit" block size="lg" disabled={form.processing}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
