export type PlanTier = 'essencial' | 'academia' | 'ilimitado'
export type BillingCycle = 'monthly' | 'yearly'

export interface AdminAcademy {
  id: string
  name: string
  slug: string
  planTier: PlanTier
  planName: string
  billingCycle: BillingCycle
  isFounder: boolean
  founderSince: string | null
  trialEndsAt: string | null
  inTrial: boolean
  suspended: boolean
  activeStudents: number
  /** Mais alunos ativos que a faixa permite. */
  overLimit: boolean
  suggestedTier: PlanTier
  amount: number
  amountLabel: string
}

export interface TierOption {
  value: PlanTier
  name: string
  maxStudents: number | null
  monthly: number
  founderMonthly: number
}

export interface FounderSpots {
  total: number
  taken: number
  remaining: number
}
