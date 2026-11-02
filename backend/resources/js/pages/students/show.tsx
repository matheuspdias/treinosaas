import { Lock } from 'lucide-react'
import { AccessBadge } from '@/features/students/AccessBadge'
import { AccessCard } from '@/features/students/AccessCard'
import { AssessmentsCard } from '@/features/students/AssessmentsCard'
import { FrequencyCard } from '@/features/students/FrequencyCard'
import { LoadsCard } from '@/features/students/LoadsCard'
import { ProgramsCard } from '@/features/students/ProgramsCard'
import { SessionsCard } from '@/features/students/SessionsCard'
import type { StudentProfile } from '@/features/students/types'
import { PanelLayout } from '@/layouts/PanelLayout'
import { relativeDays } from '@/lib/format'
import { useCan } from '@/lib/useCan'
import type { StudentSummary } from '@/types'
import { Avatar } from '@/ui/components/Avatar'
import { Badge } from '@/ui/components/Badge'
import { Card } from '@/ui/components/Card'
import { PageHeader } from '@/ui/components/PageHeader'

interface Props {
  student: StudentSummary
  profile: StudentProfile | null
  templates: { id: string; name: string }[]
  firstAccessHours: number
}

export default function StudentShow({ student, profile, templates, firstAccessHours }: Props) {
  const can = useCan()

  return (
    <PanelLayout title={student.name}>
      <PageHeader title={student.name} back="/alunos" />

      <div className="flex flex-col gap-4 px-4 pt-2 lg:px-6">
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={student.name} className="size-14 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{student.phone ?? student.phoneMasked}</p>
            <p className="text-sm text-fg-muted">
              Último treino {relativeDays(student.lastWorkoutAt)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {student.status === 'inactive' ? (
                <Badge>Inativo</Badge>
              ) : (
                <AccessBadge access={student.access} />
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {can('students.manage') && <AccessCard student={student} hours={firstAccessHours} />}
            {profile && (
              <ProgramsCard
                studentId={student.id}
                programs={profile.programs}
                templates={templates}
                canManage={can('programs.manage') && student.status === 'active'}
              />
            )}
            {profile && <FrequencyCard trainingDays={profile.trainingDays} />}
          </div>
          <div className="flex flex-col gap-4">
            {profile ? (
              <>
                <LoadsCard loads={profile.loads} />
                <SessionsCard sessions={profile.sessions} />
                <AssessmentsCard
                  studentId={student.id}
                  assessments={profile.assessments}
                  canManage={can('assessments.manage')}
                />
              </>
            ) : (
              <Card className="flex items-center gap-3 p-5 text-fg-muted">
                <Lock className="size-5" /> Treinos e histórico ficam com os instrutores.
              </Card>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  )
}
