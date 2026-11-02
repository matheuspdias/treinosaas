<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Assessment;
use App\Models\Notice;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Services\AcademyService;
use App\Services\ProgramService;
use App\Services\WorkoutSyncService;
use App\Tenancy\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Dados de desenvolvimento: duas academias para ver o isolamento na prática.
 * Senhas do painel: "password". Alunos entram no app pelo celular (primeiro acesso liberado).
 */
class DatabaseSeeder extends Seeder
{
    public function run(AcademyService $academies, TenantContext $context): void
    {
        $owner = User::factory()->create(['name' => 'Dono Demo', 'email' => 'dono@demo.test']);
        $instructor = User::factory()->create(['name' => 'Instrutor Demo', 'email' => 'instrutor@demo.test']);
        $otherOwner = User::factory()->create(['name' => 'Dono Outra', 'email' => 'dono@outra.test']);

        $demo = $academies->createWithOwner('Academia Demo', $owner);
        $academies->addMember($demo, $instructor, Role::Instructor);
        $instructor->forceFill(['current_academy_id' => $demo->id])->save();
        $other = $academies->createWithOwner('Academia Outra', $otherOwner);

        $context->run($demo, fn () => $this->demoAcademy($instructor));
        $context->run($other, function () {
            $this->student('Carla Dias', '21987654321');
        });
    }

    private function demoAcademy(User $instructor): void
    {
        $programs = app(ProgramService::class);

        $template = $programs->createTemplate([
            'name' => 'Hipertrofia ABC',
            'notes' => 'Aquecer 10 minutos antes. Beber água entre os exercícios.',
            'plans' => [
                $this->plan('Treino A', 'lime', [
                    ['Barbell_Bench_Press_-_Medium_Grip', 4, 8, 10, 40, 'Escápulas encaixadas, desça até o peito.'],
                    ['Incline_Dumbbell_Press', 3, 10, 12, 16, null],
                    ['Dumbbell_Flyes', 3, 12, 15, 10, 'Movimento lento, sem bater os halteres.'],
                    ['Triceps_Pushdown', 3, 10, 12, 25, null],
                ]),
                $this->plan('Treino B', 'cyan', [
                    ['Wide-Grip_Lat_Pulldown', 4, 8, 12, 45, 'Puxe até o queixo, sem balançar o tronco.'],
                    ['Seated_Cable_Rows', 3, 10, 12, 40, null],
                    ['Barbell_Curl', 3, 8, 12, 20, null],
                ]),
                $this->plan('Treino C', 'orange', [
                    ['Barbell_Squat', 4, 8, 10, 60, 'Joelhos alinhados com a ponta dos pés. Desça em 3 segundos.'],
                    ['Leg_Press', 3, 10, 12, 120, null],
                    ['Lying_Leg_Curls', 3, 10, 12, 30, null],
                    ['Standing_Calf_Raises', 4, 12, 15, 40, null],
                ]),
            ],
        ], $instructor);

        $programs->createTemplate([
            'name' => 'Full Body iniciante',
            'plans' => [$this->plan('Treino único', 'emerald', [
                ['Leg_Press', 3, 12, 15, 80, null],
                ['Machine_Bench_Press', 3, 12, 15, 20, null],
                ['Seated_Cable_Rows', 3, 12, 15, 30, null],
            ])],
        ], $instructor);

        $ana = $this->student('Ana Souza', '11987654321');
        $bruno = $this->student('Bruno Lima', '11976543210');
        $this->student('Camila Rocha', '11965432109');
        $sumido = $this->student('Diego Alves', '11954321098');
        $sumido->forceFill(['created_at' => now()->subMonths(2), 'last_workout_at' => now()->subDays(19)])->save();

        $programs->assignTemplate($template, [$ana->id, $bruno->id], $instructor, [
            'expires_on' => today()->addWeeks(5)->toDateString(),
        ]);
        $programs->assignTemplate($template, [$sumido->id], $instructor, [
            'starts_on' => today()->subWeeks(7)->toDateString(),
            'expires_on' => today()->subDays(3)->toDateString(),
        ]);

        $this->history($ana);

        Assessment::query()->create([
            'student_id' => $ana->id, 'assessed_on' => today()->subMonths(2), 'weight_kg' => 64.8,
            'height_cm' => 165, 'body_fat_pct' => 27.5, 'measurements_cm' => ['waist' => 76, 'hips' => 101],
        ]);
        Assessment::query()->create([
            'student_id' => $ana->id, 'assessed_on' => today()->subDays(5), 'weight_kg' => 63.1,
            'height_cm' => 165, 'body_fat_pct' => 25.2, 'measurements_cm' => ['waist' => 73, 'hips' => 100],
            'notes' => 'Ótima evolução. Manter a frequência de 4x por semana.',
        ]);

        Notice::query()->create([
            'title' => 'Horário do feriado',
            'body' => "Na sexta-feira abriremos das 8h às 14h.\nBom descanso a todos!",
            'pinned' => true,
            'published_at' => now()->subDay(),
        ]);
    }

    /** 6 semanas de treinos da Ana, com progressão de carga, como se viessem do app. */
    private function history(Student $student): void
    {
        $program = Program::query()->where('student_id', $student->id)->whereNull('archived_at')->with('plans.exercises')->sole();
        $sessions = [];

        foreach (range(17, 0) as $i) {
            $plan = $program->plans[$i % 3];
            $day = now()->subDays((int) round($i * 2.4))->setTime(18, 30);
            $week = intdiv(17 - $i, 3);
            $sessions[] = [
                'id' => (string) Str::uuid(),
                'planId' => $plan->id,
                'planName' => $plan->name,
                'startedAt' => $day->toIso8601String(),
                'finishedAt' => $day->copy()->addMinutes(55)->toIso8601String(),
                'exercises' => $plan->exercises->map(fn ($e, $n) => [
                    'planExerciseId' => $e->id,
                    'exercise' => ['source' => 'catalog', 'id' => $e->exercise_id],
                    'exerciseName' => $e->exercise_name,
                    'sets' => collect(range(1, $e->sets))->map(fn ($s) => [
                        'weightKg' => $e->load_kg + $week * $e->increment_kg,
                        'reps' => $e->rep_max - ($s - 1),
                        'isWarmup' => false,
                        'completedAt' => $day->copy()->addMinutes(5 + $n * 10 + $s * 2)->toIso8601String(),
                    ])->all(),
                ])->all(),
            ];
        }

        app(WorkoutSyncService::class)->ingest($student, $sessions);
        $program->forceFill(['seen_at' => now()->subWeeks(5)])->save();
    }

    private function student(string $name, string $phone): Student
    {
        $student = Student::factory()->create(['name' => $name, 'phone' => $phone]);
        $student->forceFill(['first_access_until' => now()->addHours(48)])->save();

        return $student;
    }

    /** @param list<array{0: string, 1: int, 2: int, 3: int, 4: float, 5: ?string}> $exercises */
    private function plan(string $name, string $color, array $exercises): array
    {
        return [
            'name' => $name,
            'color' => $color,
            'exercises' => array_map(fn ($e) => [
                'exercise_id' => $e[0], 'sets' => $e[1], 'rep_min' => $e[2], 'rep_max' => $e[3],
                'load_kg' => $e[4], 'rest_sec' => 90, 'increment_kg' => 2.5, 'notes' => $e[5],
            ], $exercises),
        ];
    }
}
