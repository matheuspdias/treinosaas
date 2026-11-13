<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class FounderProgramTest extends TestCase
{
    use RefreshDatabase;

    public function test_vagas_sao_contadas_no_banco(): void
    {
        Academy::factory()->count(3)->create(['is_founder' => true]);
        Academy::factory()->create();

        $this->getJson('/api/founders/spots')
            ->assertOk()
            ->assertExactJson(['total' => 10, 'taken' => 3, 'remaining' => 7]);
    }

    public function test_nunca_fica_negativo(): void
    {
        config(['pricing.founder.spots_total' => 2]);
        Academy::factory()->count(3)->create(['is_founder' => true]);

        $this->getJson('/api/founders/spots')->assertJson(['total' => 2, 'taken' => 3, 'remaining' => 0]);
    }

    public function test_perde_o_status_quem_cancelou_ou_esta_inadimplente_ha_mais_de_30_dias(): void
    {
        $emDia = Academy::factory()->create(['is_founder' => true]);
        $suspensaRecente = Academy::factory()->create(['is_founder' => true, 'suspended_at' => now()->subDays(10)]);
        $inadimplente = Academy::factory()->create(['is_founder' => true, 'suspended_at' => now()->subDays(31), 'founder_since' => '2026-01-01']);
        $cancelada = Academy::factory()->create(['is_founder' => true, 'deactivated_at' => now()]);

        $this->artisan('academy:review-founders')->assertSuccessful();

        $this->assertTrue($emDia->fresh()->is_founder);
        $this->assertTrue($suspensaRecente->fresh()->is_founder);
        $this->assertFalse($inadimplente->fresh()->is_founder);
        $this->assertNull($inadimplente->fresh()->founder_since);
        $this->assertFalse($cancelada->fresh()->is_founder);

        // A vaga volta a ficar livre na hora (cache limpo).
        $this->getJson('/api/founders/spots')->assertJson(['taken' => 2]);
    }

    public function test_cache_e_limpo_quando_o_admin_muda_o_status(): void
    {
        Cache::flush();
        $this->getJson('/api/founders/spots')->assertJson(['taken' => 0]);

        $admin = $this->superAdmin();
        $academy = Academy::factory()->create();
        $this->actingAs($admin)->put("/admin/academias/{$academy->id}", $this->billing(['is_founder' => true]))->assertRedirect();

        $this->getJson('/api/founders/spots')->assertJson(['taken' => 1]);
    }

    /** @param  array<string, mixed>  $overrides */
    private function billing(array $overrides = []): array
    {
        return [...['plan_tier' => 'essencial', 'billing_cycle' => 'monthly', 'is_founder' => false, 'trial_ends_at' => null], ...$overrides];
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['is_super_admin' => true]);
    }
}
