<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Academy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class AcademySuspensionTest extends TestCase
{
    use RefreshDatabase;

    public function test_comandos_suspendem_e_reativam_pelo_slug(): void
    {
        $academy = Academy::factory()->create(['name' => 'Academia X', 'slug' => 'academia-x']);

        $this->artisan('academy:suspend', ['slug' => 'academia-x', '--reason' => 'atraso'])->assertSuccessful();
        $this->assertTrue($academy->fresh()->isSuspended());
        $this->assertSame('atraso', $academy->fresh()->suspension_reason);

        $this->artisan('academy:list')->expectsOutputToContain('Suspensa desde')->assertSuccessful();

        $this->artisan('academy:reactivate', ['slug' => 'academia-x'])->assertSuccessful();
        $this->assertFalse($academy->fresh()->isSuspended());
        $this->assertNull($academy->fresh()->suspension_reason);

        $this->artisan('academy:suspend', ['slug' => 'nao-existe'])->assertFailed();
    }

    public function test_painel_continua_acessivel_e_avisa_a_equipe(): void
    {
        $owner = $this->member(Role::Owner);
        $academy = $owner->currentAcademy;

        $this->actingAs($owner)->get('/dashboard')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('academy.suspended', false));

        $academy->forceFill(['suspended_at' => now()])->save();

        $this->actingAs($owner)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('academy.suspended', true));
    }
}
