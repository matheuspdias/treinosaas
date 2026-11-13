<?php

namespace Tests\Feature;

use App\Enums\PlanTier;
use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAcademiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_so_super_admin_entra(): void
    {
        $this->get('/admin/academias')->assertRedirect('/login');
        $this->actingAs($this->member(Role::Owner))->get('/admin/academias')->assertForbidden();
        $this->actingAs($this->superAdmin())->get('/admin/academias')->assertOk();
    }

    public function test_super_admin_sem_academia_vai_para_o_admin(): void
    {
        $this->actingAs($this->superAdmin())->get('/dashboard')->assertRedirect('/admin/academias');
    }

    public function test_lista_com_alunos_ativos_e_valor(): void
    {
        $academy = Academy::factory()->create(['name' => 'Força', 'plan_tier' => 'academia', 'is_founder' => true]);
        $this->student($academy);
        $this->student($academy, ['status' => 'inactive']);

        $this->actingAs($this->superAdmin())->get('/admin/academias')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academies/index')
                ->where('academies.0.name', 'Força')
                ->where('academies.0.activeStudents', 1)
                ->where('academies.0.amountLabel', 'R$ 79/mês')
                ->where('founders.taken', 1));
    }

    public function test_cria_academia_com_dono_plano_e_teste(): void
    {
        $this->actingAs($this->superAdmin())->post('/admin/academias', [
            'name' => 'Academia Nova',
            'owner_email' => 'dono@nova.test',
            'owner_name' => 'Dono',
            'plan_tier' => 'academia',
            'billing_cycle' => 'yearly',
            'is_founder' => true,
            'trial_ends_at' => today()->addDays(14)->toDateString(),
        ])->assertRedirect('/admin/academias')->assertSessionHas('success', fn (string $m) => str_contains($m, 'Senha provisória'));

        $academy = Academy::query()->where('slug', 'academia-nova')->sole();
        $this->assertSame(PlanTier::Academia, $academy->plan_tier);
        $this->assertTrue($academy->is_founder);
        $this->assertTrue($academy->founder_since->isToday());
        $this->assertSame(today()->addDays(14)->toDateString(), $academy->trial_ends_at->toDateString());
        $this->assertSame(Role::Owner, User::query()->where('email', 'dono@nova.test')->sole()->roleIn($academy));
    }

    public function test_formulario_sugere_teste_de_14_dias(): void
    {
        $this->actingAs($this->superAdmin())->get('/admin/academias/nova')
            ->assertInertia(fn (Assert $page) => $page
                ->where('suggestedTrialEndsAt', today()->addDays(14)->toDateString())
                ->where('tiers.1.founderMonthly', 79));
    }

    public function test_formulario_de_edicao_nao_sobrescreve_a_academia_do_layout(): void
    {
        $academy = Academy::factory()->create(['name' => 'Força']);

        $this->actingAs($this->superAdmin())->get("/admin/academias/{$academy->id}/editar")
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academies/form')
                ->where('target.name', 'Força')
                ->where('academy', null));
    }

    public function test_nao_marca_fundadora_sem_vaga(): void
    {
        config(['pricing.founder.spots_total' => 1]);
        Academy::factory()->create(['is_founder' => true]);
        $academy = Academy::factory()->create();

        $this->actingAs($this->superAdmin())
            ->put("/admin/academias/{$academy->id}", ['plan_tier' => 'essencial', 'billing_cycle' => 'monthly', 'is_founder' => true])
            ->assertSessionHasErrors('is_founder');

        $this->assertFalse($academy->fresh()->is_founder);
    }

    public function test_tirar_o_status_libera_a_vaga_e_limpa_a_data(): void
    {
        $academy = Academy::factory()->create(['is_founder' => true, 'founder_since' => '2026-11-01']);

        $this->actingAs($this->superAdmin())
            // Como o formulário manda: campos de criação vazios.
            ->put("/admin/academias/{$academy->id}", ['name' => '', 'owner_email' => '', 'owner_name' => '', 'plan_tier' => 'ilimitado', 'billing_cycle' => 'monthly', 'is_founder' => false, 'founder_since' => '', 'trial_ends_at' => ''])
            ->assertRedirect('/admin/academias');

        $academy->refresh();
        $this->assertFalse($academy->is_founder);
        $this->assertNull($academy->founder_since);
        $this->assertSame(PlanTier::Ilimitado, $academy->plan_tier);
    }

    public function test_comando_da_acesso_de_super_admin(): void
    {
        $user = User::factory()->create(['email' => 'eu@treinobox.test']);

        $this->artisan('admin:grant', ['email' => 'eu@treinobox.test'])->assertSuccessful();
        $this->assertTrue($user->fresh()->isSuperAdmin());

        $this->artisan('admin:grant', ['email' => 'eu@treinobox.test', '--revoke' => true])->assertSuccessful();
        $this->assertFalse($user->fresh()->isSuperAdmin());
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['is_super_admin' => true]);
    }
}
