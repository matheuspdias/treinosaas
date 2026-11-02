import { useState } from 'react'
import { useNavigate } from 'react-router'
import { TemplateList } from '@/features/onboarding/TemplateList'
import { toast } from '@/stores/toastStore'
import { PageHeader } from '@/ui/components/PageHeader'
import { applyTemplate } from './planActions'

/** Adicionar fichas de um modelo pronto a qualquer momento (as fichas atuais não mudam). */
export function TemplatesPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  return (
    <>
      <PageHeader
        back="/fichas"
        title="Modelos prontos"
        subtitle="As fichas entram no fim da sua sequência"
      />
      <div className="px-4 pb-8">
        <TemplateList
          busy={busy}
          onApply={async (t) => {
            setBusy(true)
            try {
              const created = await applyTemplate(t)
              toast(`${created.length} fichas adicionadas.`, { tone: 'success' })
              navigate('/fichas', { replace: true })
            } finally {
              setBusy(false)
            }
          }}
        />
      </div>
    </>
  )
}
