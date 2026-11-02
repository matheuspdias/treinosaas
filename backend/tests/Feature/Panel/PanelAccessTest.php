<?php

namespace Tests\Feature\Panel;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PanelAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_mostra_a_academia_e_as_permissoes_do_dono(): void
    {
        $owner = $this->member(Role::Owner);

        $this->actingAs($owner)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('academy.id', $owner->current_academy_id)
                ->where('academy.role', 'owner')
                ->where('academy.abilities', fn ($abilities) => collect($abilities)->contains('academy.manage'))
                ->missing('auth.user.password')
                ->missing('auth.user.remember_token'));
    }

    public function test_mostra_so_as_permissoes_do_instrutor(): void
    {
        $instructor = $this->member(Role::Instructor);

        $this->actingAs($instructor)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('academy.role', 'instructor')
                ->where('academy.abilities', fn ($abilities) => ! collect($abilities)->contains('students.manage')));
    }

    public function test_bloqueia_quem_nao_tem_vinculo_com_academia(): void
    {
        $this->actingAs(User::factory()->create())->get('/dashboard')->assertForbidden();
    }

    public function test_bloqueia_academia_desativada(): void
    {
        $owner = $this->member(Role::Owner);
        Academy::query()->whereKey($owner->current_academy_id)->update(['deactivated_at' => now()]);

        $this->actingAs($owner)->get('/dashboard')->assertForbidden();
    }

    public function test_ignora_academia_atual_em_que_o_usuario_nao_tem_vinculo(): void
    {
        $owner = $this->member(Role::Owner);
        $mine = $owner->current_academy_id;
        $owner->forceFill(['current_academy_id' => Academy::factory()->create()->id])->save();

        $this->actingAs($owner)->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('academy.id', $mine));

        $this->assertSame($mine, $owner->fresh()->current_academy_id);
    }

    public function test_nao_tem_cadastro_publico(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', ['email' => 'x@x.test'])->assertNotFound();
    }
}
