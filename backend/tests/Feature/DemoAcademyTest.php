<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\Student;
use App\Models\User;
use App\Models\WorkoutSession;
use App\Services\DemoAcademyService;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoAcademyTest extends TestCase
{
    use RefreshDatabase;

    public function test_cria_a_demo_e_o_aluno_entra_com_o_pin(): void
    {
        $this->artisan('academy:demo')->assertSuccessful();

        $owner = User::query()->where('email', 'demo@treinobox.com.br')->sole();
        $academy = Academy::query()->where('name', DemoAcademyService::NAME)->sole();
        $this->assertSame($academy->id, $owner->current_academy_id);
        $this->assertFalse($academy->is_founder);

        app(TenantContext::class)->run($academy, function () {
            $this->assertSame(10, Student::query()->count());
            $this->assertGreaterThan(50, WorkoutSession::query()->count());
        });

        $this->postJson('/api/student/auth/login', [
            'phone' => '11900000001',
            'academy' => $academy->slug,
            'pin' => DemoAcademyService::STUDENT_PIN,
            'device' => 'teste',
        ])->assertOk();
    }

    public function test_rodar_de_novo_so_troca_a_senha(): void
    {
        $this->artisan('academy:demo')->assertSuccessful();
        $old = User::query()->where('email', 'demo@treinobox.com.br')->value('password');

        $this->artisan('academy:demo')->assertSuccessful();

        $this->assertSame(1, Academy::query()->where('name', DemoAcademyService::NAME)->count());
        $this->assertNotSame($old, User::query()->where('email', 'demo@treinobox.com.br')->value('password'));
    }
}
