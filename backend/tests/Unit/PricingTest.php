<?php

namespace Tests\Unit;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use App\Models\Academy;
use App\Support\Pricing\Pricing;
use Tests\TestCase;

class PricingTest extends TestCase
{
    private Pricing $pricing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricing = new Pricing;
    }

    public function test_preco_de_fundador_e_45_por_cento_arredondado_para_final_9(): void
    {
        $this->assertSame(49.0, $this->pricing->founderMonthly(PlanTier::Essencial));
        $this->assertSame(79.0, $this->pricing->founderMonthly(PlanTier::Academia));
        $this->assertSame(129.0, $this->pricing->founderMonthly(PlanTier::Ilimitado));
    }

    public function test_preco_de_fundador_acompanha_a_tabela_vigente(): void
    {
        config(['pricing.tiers.academia.monthly' => 199]);

        // 199 × 0,55 = 109,45 → 109
        $this->assertSame(109.0, $this->pricing->founderMonthly(PlanTier::Academia));
    }

    public function test_anual_paga_10_meses_e_leva_12(): void
    {
        $this->assertSame(890.0, $this->pricing->yearlyTotal(PlanTier::Essencial, false));
        $this->assertSame(74.17, $this->pricing->yearlyMonthlyEquivalent(PlanTier::Essencial, false));
        $this->assertSame(490.0, $this->pricing->yearlyTotal(PlanTier::Essencial, true));
        $this->assertSame(40.83, $this->pricing->yearlyMonthlyEquivalent(PlanTier::Essencial, true));
    }

    public function test_faixa_pelo_numero_de_alunos_ativos(): void
    {
        $this->assertSame(PlanTier::Essencial, $this->pricing->tierFor(0));
        $this->assertSame(PlanTier::Essencial, $this->pricing->tierFor(100));
        $this->assertSame(PlanTier::Academia, $this->pricing->tierFor(101));
        $this->assertSame(PlanTier::Academia, $this->pricing->tierFor(300));
        $this->assertSame(PlanTier::Ilimitado, $this->pricing->tierFor(301));
    }

    public function test_assinatura_da_academia_fundadora_muda_de_faixa_com_desconto(): void
    {
        $academy = new Academy(['name' => 'X']);
        $academy->forceFill(['plan_tier' => PlanTier::Academia, 'billing_cycle' => BillingCycle::Monthly, 'is_founder' => true]);

        $this->assertSame(79.0, $this->pricing->subscription($academy)['amount']);

        $academy->plan_tier = PlanTier::Ilimitado;
        $this->assertSame(129.0, $this->pricing->subscription($academy)['amount']);

        $academy->forceFill(['is_founder' => false, 'billing_cycle' => BillingCycle::Yearly]);
        $subscription = $this->pricing->subscription($academy);
        $this->assertSame(2290.0, $subscription['amount']);
        $this->assertSame(190.83, $subscription['monthlyEquivalent']);
    }

    public function test_formata_em_reais(): void
    {
        $this->assertSame('R$ 89', Pricing::brl(89));
        $this->assertSame('R$ 74,17', Pricing::brl(74.17));
        $this->assertSame('R$ 2.290', Pricing::brl(2290));
    }
}
