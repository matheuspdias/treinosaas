import { createBrowserRouter } from 'react-router'
import { PageSpinner } from '@/ui/components/Spinner'
import { Layout } from './Layout'
import { RouteError } from './RouteError'

/* Rotas carregadas sob demanda: o primeiro carregamento fica leve. */
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/features/home/HomePage')).HomePage }),
      },
      {
        path: 'fichas',
        lazy: async () => ({ Component: (await import('@/features/plans/PlansPage')).PlansPage }),
      },
      {
        path: 'fichas/:planId',
        lazy: async () => ({
          Component: (await import('@/features/plans/PlanEditorPage')).PlanEditorPage,
        }),
      },
      {
        path: 'fichas/:planId/adicionar',
        lazy: async () => ({
          Component: (await import('@/features/exercises/ExercisePickerPage')).ExercisePickerPage,
        }),
      },
      {
        path: 'exercicios',
        lazy: async () => ({
          Component: (await import('@/features/exercises/LibraryPage')).LibraryPage,
        }),
      },
      {
        path: 'exercicios/novo',
        lazy: async () => ({
          Component: (await import('@/features/exercises/CustomExerciseFormPage'))
            .CustomExerciseFormPage,
        }),
      },
      {
        path: 'exercicios/custom/:id/editar',
        lazy: async () => ({
          Component: (await import('@/features/exercises/CustomExerciseFormPage'))
            .CustomExerciseFormPage,
        }),
      },
      {
        path: 'exercicios/:source/:id',
        lazy: async () => ({
          Component: (await import('@/features/exercises/ExerciseDetailPage')).ExerciseDetailPage,
        }),
      },
      {
        path: 'treino',
        lazy: async () => ({
          Component: (await import('@/features/workout/WorkoutPage')).WorkoutPage,
        }),
      },
      {
        path: 'treino/:sessionId/resumo',
        lazy: async () => ({
          Component: (await import('@/features/summary/SummaryPage')).SummaryPage,
        }),
      },
      {
        path: 'exercicios/:source/:id/historico',
        lazy: async () => ({
          Component: (await import('@/features/exercises/ExerciseHistoryPage')).ExerciseHistoryPage,
        }),
      },
      {
        path: 'progresso',
        lazy: async () => ({
          Component: (await import('@/features/progress/ProgressPage')).ProgressPage,
        }),
      },
      {
        path: 'progresso/recordes',
        lazy: async () => ({
          Component: (await import('@/features/progress/RecordsPage')).RecordsPage,
        }),
      },
      {
        path: 'progresso/corpo',
        lazy: async () => ({
          Component: (await import('@/features/progress/BodyPage')).BodyPage,
        }),
      },
      {
        path: 'boas-vindas',
        lazy: async () => ({
          Component: (await import('@/features/onboarding/OnboardingPage')).OnboardingPage,
        }),
      },
      {
        path: 'fichas/modelos',
        lazy: async () => ({
          Component: (await import('@/features/plans/TemplatesPage')).TemplatesPage,
        }),
      },
      {
        path: 'importar',
        lazy: async () => ({
          Component: (await import('@/features/share/ImportPlanPage')).ImportPlanPage,
        }),
      },
      {
        path: 'ajustes',
        lazy: async () => ({
          Component: (await import('@/features/settings/SettingsPage')).SettingsPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./NotFoundPage')).NotFoundPage }),
      },
    ],
  },
])
