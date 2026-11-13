<?php

namespace App\Support\Pricing;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use App\Models\Academy;

/**
 * Todas as contas de preço do TreinoBox, a partir de config/pricing.php.
 *
 * Preço de fundador: 45% de desconto sobre o preço cheio VIGENTE da faixa (se a tabela ou a faixa
 * mudar, o preço de fundador acompanha), arredondado para o valor terminado em 9 mais próximo.
 * Anual: paga `annual_months_paid` meses e leva 12.
 */
class Pricing
{
    public function name(PlanTier $tier): string
    {
        return $this->tier($tier)['name'];
    }

    /** null = sem limite de alunos. */
    public function maxStudents(PlanTier $tier): ?int
    {
        return $this->tier($tier)['max_students'];
    }

    /** Preço cheio mensal da faixa. */
    public function fullMonthly(PlanTier $tier): float
    {
        return (float) $this->tier($tier)['monthly'];
    }

    public function founderMonthly(PlanTier $tier): float
    {
        $discounted = $this->fullMonthly($tier) * (1 - config('pricing.founder.discount'));

        // Valor terminado em 9 mais próximo (empate fica com o maior).
        return (float) (round(($discounted - 9) / 10) * 10 + 9);
    }

    public function monthly(PlanTier $tier, bool $founder): float
    {
        return $founder ? $this->founderMonthly($tier) : $this->fullMonthly($tier);
    }

    /** Total cobrado no plano anual (paga 10 meses, leva 12). */
    public function yearlyTotal(PlanTier $tier, bool $founder): float
    {
        return $this->monthly($tier, $founder) * config('pricing.annual_months_paid');
    }

    /** Quanto o anual dá por mês (ex.: 89 × 10 / 12 = 74,17). */
    public function yearlyMonthlyEquivalent(PlanTier $tier, bool $founder): float
    {
        return round($this->yearlyTotal($tier, $founder) / 12, 2);
    }

    /** Menor faixa que comporta esse número de alunos ativos. */
    public function tierFor(int $activeStudents): PlanTier
    {
        foreach (PlanTier::cases() as $tier) {
            $max = $this->maxStudents($tier);

            if ($max === null || $activeStudents <= $max) {
                return $tier;
            }
        }

        return PlanTier::Ilimitado;
    }

    /**
     * Valor da assinatura da academia no ciclo dela (mensal: por mês; anual: o total do ano).
     * O desconto de fundador só vale com a academia marcada como fundadora; quem perde o status
     * (ver academy:review-founders) volta ao preço cheio da faixa.
     *
     * @return array{tier: PlanTier, cycle: BillingCycle, founder: bool, amount: float, monthlyEquivalent: float}
     */
    public function subscription(Academy $academy): array
    {
        $tier = $academy->plan_tier;
        $cycle = $academy->billing_cycle;
        $founder = (bool) $academy->is_founder;
        $yearly = $cycle === BillingCycle::Yearly;

        return [
            'tier' => $tier,
            'cycle' => $cycle,
            'founder' => $founder,
            'amount' => $yearly ? $this->yearlyTotal($tier, $founder) : $this->monthly($tier, $founder),
            'monthlyEquivalent' => $yearly ? $this->yearlyMonthlyEquivalent($tier, $founder) : $this->monthly($tier, $founder),
        ];
    }

    /** "R$ 74,17" ou "R$ 89" (sem centavos quando inteiro). */
    public static function brl(float $value): string
    {
        $cents = round($value * 100) % 100 !== 0;

        return 'R$ '.number_format($value, $cents ? 2 : 0, ',', '.');
    }

    /** @return array{name: string, max_students: int|null, monthly: int|float} */
    private function tier(PlanTier $tier): array
    {
        return config("pricing.tiers.{$tier->value}");
    }
}
