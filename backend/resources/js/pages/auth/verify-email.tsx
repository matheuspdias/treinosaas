import { router, useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/ui/components/Button'

export default function VerifyEmail({ status }: { status?: string }) {
  const form = useForm({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/email/verification-notification')
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      description="Abra o link que enviamos para o seu e-mail."
    >
      {status === 'verification-link-sent' && (
        <p className="mb-4 rounded-control bg-accent-soft p-3 text-sm">Enviamos um novo link.</p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <Button type="submit" block disabled={form.processing}>
          Reenviar link
        </Button>
        <Button variant="ghost" block onClick={() => router.post('/logout')}>
          Sair
        </Button>
      </form>
    </AuthLayout>
  )
}
