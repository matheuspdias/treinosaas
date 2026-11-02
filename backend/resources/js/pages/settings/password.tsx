import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { TextField } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { SettingsNav } from './SettingsNav'

export default function Password() {
  const form = useForm({ current_password: '', password: '', password_confirmation: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.put('/settings/password', { preserveScroll: true, onSuccess: () => form.reset() })
  }

  return (
    <PanelLayout title="Senha" width="narrow">
      <PageHeader title="Ajustes" />
      <SettingsNav />
      <Card className="mx-4 mt-2 p-5 lg:mx-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            value={form.data.current_password}
            onChange={(e) => form.setData('current_password', e.target.value)}
            error={form.errors.current_password}
          />
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={form.data.password}
            onChange={(e) => form.setData('password', e.target.value)}
            error={form.errors.password}
          />
          <TextField
            label="Repita a nova senha"
            type="password"
            autoComplete="new-password"
            value={form.data.password_confirmation}
            onChange={(e) => form.setData('password_confirmation', e.target.value)}
            error={form.errors.password_confirmation}
          />
          <Button type="submit" disabled={form.processing} className="self-start">
            {form.recentlySuccessful ? 'Senha alterada' : 'Alterar senha'}
          </Button>
        </form>
      </Card>
    </PanelLayout>
  )
}
