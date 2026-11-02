import { Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { Card } from '@/ui/components/Card'
import { PageHeader } from '@/ui/components/PageHeader'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { getThemePreference, setThemePreference, type ThemePreference } from '@/ui/theme/theme'
import { SettingsNav } from './SettingsNav'

export default function Appearance() {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference)

  return (
    <PanelLayout title="Aparência" width="narrow">
      <PageHeader title="Ajustes" />
      <SettingsNav />
      <Card className="mx-4 mt-2 p-5 lg:mx-6">
        <SegmentedControl
          label="Tema"
          value={theme}
          onChange={(v) => {
            setTheme(v)
            setThemePreference(v)
          }}
          options={[
            {
              value: 'system',
              label: (
                <>
                  <Monitor className="size-4" /> Sistema
                </>
              ),
            },
            {
              value: 'light',
              label: (
                <>
                  <Sun className="size-4" /> Claro
                </>
              ),
            },
            {
              value: 'dark',
              label: (
                <>
                  <Moon className="size-4" /> Escuro
                </>
              ),
            },
          ]}
        />
      </Card>
    </PanelLayout>
  )
}
