<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateAcademyCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_cria_a_academia_com_o_dono(): void
    {
        $this->artisan('academy:create', [
            'name' => 'Academia Força Total',
            '--owner-email' => 'dono@forca.test',
            '--owner-name' => 'Fulano',
        ])->expectsOutputToContain('Senha provisória')->assertSuccessful();

        $academy = Academy::query()->sole();
        $owner = User::query()->where('email', 'dono@forca.test')->sole();

        $this->assertSame('academia-forca-total', $academy->slug);
        $this->assertSame(Role::Owner, $owner->roleIn($academy));
        $this->assertSame($academy->id, $owner->current_academy_id);
    }

    public function test_gera_slug_unico_e_reaproveita_usuario_existente(): void
    {
        $owner = User::factory()->create(['email' => 'dono@x.test']);
        Academy::factory()->create(['slug' => 'academia-x']);

        $this->artisan('academy:create', ['name' => 'Academia X', '--owner-email' => 'dono@x.test'])
            ->doesntExpectOutputToContain('Senha provisória')
            ->assertSuccessful();

        $this->assertTrue(Academy::query()->where('slug', 'academia-x-2')->exists());
        $this->assertSame(1, User::query()->count());
        $this->assertSame(1, $owner->fresh()->academies()->count());
    }
}
