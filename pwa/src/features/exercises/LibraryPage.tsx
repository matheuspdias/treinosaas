import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useLibraryStore } from '@/stores/libraryStore'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { ExerciseBrowser } from './components/ExerciseBrowser'

export function LibraryPage() {
  const navigate = useNavigate()
  const { filters, setFilters } = useLibraryStore()
  return (
    <>
      <PageHeader
        title="Exercícios"
        actions={
          <IconButton
            label="Criar exercício personalizado"
            variant="primary"
            icon={<Plus className="size-6" />}
            onClick={() => navigate('/exercicios/novo')}
          />
        }
      />
      <ExerciseBrowser
        filters={filters}
        onFiltersChange={setFilters}
        onOpen={(ex) => navigate(`/exercicios/${ex.ref.source}/${encodeURIComponent(ex.ref.id)}`)}
      />
    </>
  )
}
