import { router, useForm, usePage } from '@inertiajs/react'
import { LogOut } from 'lucide-react'
import type { FormEvent } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import type { SharedData } from '@/types'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { TextField } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { SettingsNav } from './SettingsNav'

export default function Profile() {
  const { auth, academy } = usePage<SharedData>().props
  const form = useForm({ name: auth.user?.name ?? '', email: auth.user?.email ?? '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.patch('/settings/profile', { preserveScroll: true })
  }

  return (
    <PanelLayout title="Perfil" width="narrow">
      <PageHeader
        title="Ajustes"
        subtitle={academy ? `${academy.name} · ${academy.roleLabel}` : undefined}
      />
      <SettingsNav />
      <div className="flex flex-col gap-4 px-4 pt-2 lg:px-6">
        <Card className="p-5">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <TextField
              label="Nome"
              required
              autoComplete="name"
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
              error={form.errors.name}
            />
            <TextField
              label="E-mail"
              type="email"
              required
              autoComplete="email"
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              error={form.errors.email}
            />
            <Button type="submit" disabled={form.processing} className="self-start">
              {form.recentlySuccessful ? 'Salvo' : 'Salvar'}
            </Button>
          </form>
        </Card>
        <Button
          variant="secondary"
          icon={<LogOut className="size-5" />}
          onClick={() => router.post('/logout')}
          className="lg:hidden"
        >
          Sair
        </Button>
      </div>
    </PanelLayout>
  )
}
