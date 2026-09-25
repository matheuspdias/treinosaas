import { create } from 'zustand'
import { EMPTY_FILTERS } from '@/catalog/search'
import type { ExerciseFilters } from '@/catalog/search'

/** Filtros da biblioteca preservados ao abrir um exercício e voltar. */
interface LibraryState {
  filters: ExerciseFilters
  setFilters: (patch: Partial<ExerciseFilters>) => void
  reset: () => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  filters: EMPTY_FILTERS,
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  reset: () => set({ filters: EMPTY_FILTERS }),
}))
