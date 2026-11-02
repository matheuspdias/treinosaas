import { usePage } from '@inertiajs/react'
import type { Ability, SharedData } from '@/types'

/** Só esconde/mostra na interface. Quem garante a permissão é o servidor (Gate em cada rota). */
export function useCan(): (ability: Ability) => boolean {
  const { academy } = usePage<SharedData>().props
  return (ability) => academy?.abilities.includes(ability) ?? false
}
