<?php

namespace Tests\Feature\Api;

use App\Models\Academy;
use App\Models\Assessment;
use App\Models\Notice;
use App\Models\Student;
use App\Models\WorkoutSession;
use App\Models\WorkoutSet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StudentDataTest extends TestCase
{
    use RefreshDatabase;

    private Academy $academy;

    private Student $ana;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->academy = Academy::factory()->create();
        $this->ana = $this->student($this->academy, ['name' => 'Ana']);
        $this->token = $this->ana->createToken('celular', ['student'])->plainTextToken;
    }

    private function sessionPayload(string $planId, string $planExerciseId, array $overrides = []): array
    {
        return [
            'id' => (string) Str::uuid(),
            'planId' => $planId,
            'planName' => 'Treino A',
            'startedAt' => now()->subHour()->toIso8601String(),
            'finishedAt' => now()->toIso8601String(),
            'exercises' => [[
                'planExerciseId' => $planExerciseId,
                'exercise' => ['source' => 'catalog', 'id' => self::BENCH],
                'exerciseName' => 'Supino reto com barra',
                'sets' => [
                    ['weightKg' => 20, 'reps' => 15, 'isWarmup' => true, 'completedAt' => now()->subMinutes(50)->toIso8601String()],
                    ['weightKg' => 40, 'reps' => 10, 'isWarmup' => false, 'completedAt' => now()->subMinutes(45)->toIso8601String()],
                    ['weightKg' => 42.5, 'reps' => 8, 'isWarmup' => false, 'completedAt' => now()->subMinutes(40)->toIso8601String()],
                    ['weightKg' => 45, 'reps' => null, 'isWarmup' => false],
                ],
            ]],
            ...$overrides,
        ];
    }

    public function test_lista_so_os_treinos_ativos_do_proprio_aluno(): void
    {
        $mine = $this->program($this->academy, $this->ana, ['expires_on' => today()->addWeeks(4)->toDateString()]);
        $this->program($this->academy, $this->student($this->academy));
        $this->program($this->academy); // modelo
        $this->program(Academy::factory()->create(), null);

        $this->withToken($this->token)->getJson('/api/student/programs')
            ->assertOk()
            ->assertJsonCount(1, 'programs')
            ->assertJsonPath('programs.0.id', $mine->id)
            ->assertJsonPath('programs.0.isNew', true)
            ->assertJsonPath('programs.0.plans.0.exercises.0.exercise', ['source' => 'catalog', 'id' => self::BENCH])
            ->assertJsonPath('programs.0.plans.0.exercises.0.notes', 'Desça controlando')
            ->assertJsonPath('programs.0.plans.1.name', 'Treino B');
    }

    public function test_marca_como_visto_so_o_proprio_treino(): void
    {
        $mine = $this->program($this->academy, $this->ana);
        $other = $this->program($this->academy, $this->student($this->academy));
        $foreign = $this->program(Academy::factory()->create(), null);

        $this->withToken($this->token)->postJson("/api/student/programs/{$mine->id}/seen")->assertNoContent();
        $this->withToken($this->token)->postJson("/api/student/programs/{$other->id}/seen")->assertNotFound();
        $this->withToken($this->token)->postJson("/api/student/programs/{$foreign->id}/seen")->assertNotFound();

        $this->withToken($this->token)->getJson('/api/student/programs')->assertJsonPath('programs.0.isNew', false);
    }

    public function test_recebe_treinos_de_forma_idempotente_e_calcula_volume(): void
    {
        $program = $this->program($this->academy, $this->ana);
        [$planId, $exerciseId] = $this->inAcademy($this->academy, function () use ($program) {
            $plan = $program->plans()->with('exercises')->first();

            return [$plan->id, $plan->exercises[0]->id];
        });
        $session = $this->sessionPayload($planId, $exerciseId);

        $this->withToken($this->token)->postJson('/api/student/workouts', ['sessions' => [$session]])
            ->assertOk()->assertExactJson(['accepted' => [$session['id']], 'rejected' => []]);
        $this->withToken($this->token)->postJson('/api/student/workouts', ['sessions' => [$session]])
            ->assertExactJson(['accepted' => [$session['id']], 'rejected' => []]);

        $this->inAcademy($this->academy, function () use ($program, $exerciseId) {
            $saved = WorkoutSession::query()->sole();
            $this->assertSame($program->id, $saved->program_id);
            $this->assertSame(40 * 10 + 42.5 * 8, $saved->volume_kg);
            $this->assertSame(2, $saved->sets_count);
            $this->assertSame(3, WorkoutSet::query()->count(), 'série sem completedAt ignorada');
            $this->assertSame($exerciseId, WorkoutSet::query()->where('is_warmup', false)->first()->program_exercise_id);
            $this->assertNotNull($this->ana->fresh()->last_workout_at);
        });
    }

    public function test_treino_em_ficha_de_outro_aluno_fica_sem_vinculo(): void
    {
        $otherProgram = $this->program($this->academy, $this->student($this->academy));
        $planId = $this->inAcademy($this->academy, fn () => $otherProgram->plans()->first()->id);

        $this->withToken($this->token)
            ->postJson('/api/student/workouts', ['sessions' => [$this->sessionPayload($planId, (string) Str::uuid())]])
            ->assertOk();

        $this->inAcademy($this->academy, function () {
            $session = WorkoutSession::query()->sole();
            $this->assertNull($session->program_plan_id);
            $this->assertSame($this->ana->id, $session->student_id);
        });
    }

    public function test_plan_id_que_nao_e_uuid_fica_sem_vinculo(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/student/workouts', ['sessions' => [$this->sessionPayload('ficha-local-1', (string) Str::uuid())]])
            ->assertOk()->assertJsonCount(1, 'accepted');

        $this->inAcademy($this->academy, fn () => $this->assertNull(WorkoutSession::query()->sole()->program_plan_id));
    }

    public function test_id_de_treino_de_outro_aluno_e_recusado(): void
    {
        $bruno = $this->student($this->academy);
        $session = $this->sessionPayload((string) Str::uuid(), (string) Str::uuid());
        $this->withToken($bruno->createToken('x', ['student'])->plainTextToken)->postJson('/api/student/workouts', ['sessions' => [$session]]);
        $this->app['auth']->forgetGuards(); // o guard guarda o usuário entre requisições do mesmo teste

        $this->withToken($this->token)->postJson('/api/student/workouts', ['sessions' => [$session]])
            ->assertExactJson(['accepted' => [], 'rejected' => [$session['id']]]);
    }

    public function test_avisos_e_avaliacoes_da_propria_academia(): void
    {
        $this->inAcademy($this->academy, function () {
            Notice::query()->create(['title' => 'Feriado', 'body' => 'Fechado dia 15', 'published_at' => now()->subDay()]);
            Notice::query()->create(['title' => 'Futuro', 'body' => 'x', 'published_at' => now()->addDay()]);
            Notice::query()->create(['title' => 'Expirado', 'body' => 'x', 'published_at' => now()->subWeek(), 'expires_at' => now()->subDay()]);
            Assessment::query()->create(['student_id' => $this->ana->id, 'assessed_on' => today(), 'weight_kg' => 70.5, 'measurements_cm' => ['waist' => 80]]);
        });
        $other = Academy::factory()->create();
        $this->inAcademy($other, fn () => Notice::query()->create(['title' => 'Outra', 'body' => 'x', 'published_at' => now()->subDay()]));

        $this->withToken($this->token)->getJson('/api/student/notices')
            ->assertJsonCount(1, 'notices')->assertJsonPath('notices.0.title', 'Feriado');
        $this->withToken($this->token)->getJson('/api/student/assessments')
            ->assertJsonPath('assessments.0.weightKg', 70.5)
            ->assertJsonPath('assessments.0.measurementsCm.waist', 80);
    }
}
