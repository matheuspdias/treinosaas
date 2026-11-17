<?php

namespace App\Services;

use App\Enums\BillingCycle;
use App\Enums\PlanTier;
use App\Models\Academy;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use App\Repositories\Contracts\AssessmentRepository;
use App\Repositories\Contracts\NoticeRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use App\Tenancy\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Academia de demonstração para gravar vídeos: alunos fictícios, fichas com carga e semanas
 * de treinos registrados. O dono só tem acesso a ela, então a senha não abre dado real.
 */
class DemoAcademyService
{
    public const NAME = 'Academia Demo TreinoBox';

    public const STUDENT_PIN = '2580';

    /**
     * Alunos fictícios: [nome, ficha, fator de carga, treinos registrados, dias desde o último treino, hora do treino].
     * Telefones 11 90000-00NN, um por aluno. O primeiro é o login do app.
     */
    private const STUDENTS = [
        ['Ana Souza', 'abc', 0.8, 18, 1, '18:30'],
        ['Bruno Lima', 'abc', 1.2, 15, 1, '06:30'],
        ['Camila Rocha', 'fullbody', 0.7, 8, 2, '12:00'],
        ['Diego Alves', 'upperlower', 1.1, 6, 19, '19:00'],
        ['Fernanda Costa', 'upperlower', 0.75, 12, 0, '07:00'],
        ['Gabriel Martins', 'abc', 1.3, 10, 3, '20:00'],
        ['Juliana Ribeiro', 'fullbody', 0.6, 5, 4, '17:30'],
        ['Lucas Ferreira', 'abc', 1.0, 7, 2, '21:00'],
        ['Mariana Lopes', 'upperlower', 0.85, 9, 1, '06:00'],
        ['Rafael Mendes', 'fullbody', 1.0, 0, null, '18:00'],
    ];

    public function __construct(
        private readonly AcademyBillingService $billing,
        private readonly AcademyRepository $academies,
        private readonly StudentService $studentService,
        private readonly StudentRepository $students,
        private readonly ProgramService $programs,
        private readonly WorkoutSyncService $workouts,
        private readonly AssessmentRepository $assessments,
        private readonly NoticeRepository $notices,
        private readonly TenantContext $context,
    ) {}

    /** @return array{academy: Academy, password: string, phone: string} */
    public function create(string $ownerEmail): array
    {
        return DB::transaction(function () use ($ownerEmail) {
            ['academy' => $academy, 'owner' => $owner] = $this->billing->create(self::NAME, $ownerEmail, 'Dono Demo', [
                'plan_tier' => PlanTier::Academia->value,
                'billing_cycle' => BillingCycle::Monthly->value,
                'is_founder' => false,
                'trial_ends_at' => null,
            ]);

            $this->context->run($academy, fn () => $this->fill($owner));

            return ['academy' => $academy, ...$this->resetAccess($owner)];
        });
    }

    /**
     * Senha nova para o dono e o PIN do aluno de volta ao padrão (para quando a senha se perder).
     *
     * @return array{academy: Academy, password: string, phone: string}
     */
    public function resetAccess(User $owner): array
    {
        $password = Str::password(14, symbols: false);
        $owner->forceFill(['password' => $password])->save();

        $academy = $this->academies->find($owner->current_academy_id);
        $phone = $this->phone(1);

        $this->context->run($academy, function () use ($phone) {
            $student = $this->students->findByPhone(PhoneNumber::parse($phone));
            $student?->forceFill(['pin_hash' => Hash::make(self::STUDENT_PIN), 'failed_pin_attempts' => 0, 'locked_until' => null]);
            $student && $this->students->save($student);
        });

        return ['academy' => $academy, 'password' => $password, 'phone' => $phone];
    }

    private function fill(User $owner): void
    {
        foreach (self::STUDENTS as $i => [$name, $program, $factor, $sessions, $daysAgo, $time]) {
            $student = $this->studentService->create(['name' => $name, 'phone' => $this->phone($i + 1)]);
            $joined = now()->subDays(20 + $sessions * 3);
            $student->forceFill(['created_at' => $joined]);

            if ($sessions > 0) {
                // Já entrou no app: PIN criado e aviso de privacidade aceito.
                $student->forceFill([
                    'pin_hash' => Hash::make(self::STUDENT_PIN),
                    'pin_set_at' => $joined,
                    'privacy_accepted_at' => $joined,
                    'last_seen_at' => now()->subDays($daysAgo),
                ]);
            }

            $this->students->save($student);

            $assigned = $this->programs->createForStudent($student, $this->program($program, $factor, $daysAgo), $owner);

            if ($sessions > 0) {
                $this->history($student, $assigned->load('plans.exercises'), $sessions, $daysAgo, $time);
            }
        }

        $this->assessments();

        $this->notices->create([
            'title' => 'Horário do feriado',
            'body' => "Na sexta-feira abriremos das 8h às 14h.\nBom descanso a todos!",
            'pinned' => true,
            'published_at' => now()->subDay(),
        ], $owner->id);
        $this->notices->create([
            'title' => 'Desafio do mês',
            'body' => 'Quem treinar 12 vezes no mês ganha uma garrafinha da academia. Boa sorte!',
            'pinned' => false,
            'published_at' => now()->subDays(6),
        ], $owner->id);
    }

    /** Treinos registrados como se viessem do app, com a carga subindo a cada semana. */
    private function history(Student $student, Program $program, int $count, int $daysAgo, string $time): void
    {
        $plans = $program->plans->values();
        $timezone = 'America/Sao_Paulo';
        $lastWeek = intdiv($count - 1, 3);
        $sessions = [];

        foreach (range($count - 1, 0) as $i) {
            $plan = $plans[($count - 1 - $i) % $plans->count()];
            $day = CarbonImmutable::now($timezone)
                ->subDays($daysAgo + (int) round($i * 2.3))
                ->setTimeFromTimeString($time);

            if ($day->isFuture()) {
                $day = $day->subDay();
            }

            $week = intdiv($count - 1 - $i, 3);
            $sessions[] = [
                'id' => (string) Str::uuid(),
                'planId' => $plan->id,
                'planName' => $plan->name,
                'startedAt' => $day->toIso8601String(),
                'finishedAt' => $day->addMinutes(50 + $i % 3 * 5)->toIso8601String(),
                'exercises' => $plan->exercises->map(fn ($e, $n) => [
                    'planExerciseId' => $e->id,
                    'exercise' => ['source' => 'catalog', 'id' => $e->exercise_id],
                    'exerciseName' => $e->exercise_name,
                    'sets' => collect(range(1, $e->sets))->map(fn ($s) => [
                        'weightKg' => $e->load_kg > 0 ? max(2, $e->load_kg - ($lastWeek - $week) * $e->increment_kg) : 0,
                        'reps' => max($e->rep_min, $e->rep_max - ($s - 1)),
                        'isWarmup' => false,
                        'completedAt' => $day->addMinutes(5 + $n * 9 + $s * 2)->toIso8601String(),
                    ])->all(),
                ])->all(),
            ];
        }

        $this->workouts->ingest($student, $sessions);
        $program->forceFill(['seen_at' => now()->subDays($daysAgo)])->save();
    }

    private function assessments(): void
    {
        $data = [
            1 => [[64.8, 27.5, 76, 101, 60, null], [63.1, 25.2, 73, 100, 5, 'Ótima evolução. Manter a frequência de 4x por semana.']],
            2 => [[82.4, 19.8, 88, 99, 45, null], [84.0, 18.1, 86, 99, 3, 'Ganhou massa e reduziu gordura. Subir as cargas de perna.']],
        ];

        foreach ($data as $n => $rows) {
            $student = $this->students->findByPhone(PhoneNumber::parse($this->phone($n)));
            $height = $n === 1 ? 165 : 180;

            foreach ($rows as [$weight, $fat, $waist, $hips, $daysAgo, $notes]) {
                $this->assessments->create($student, [
                    'assessed_on' => today()->subDays($daysAgo),
                    'weight_kg' => $weight,
                    'height_cm' => $height,
                    'body_fat_pct' => $fat,
                    'measurements_cm' => ['waist' => $waist, 'hips' => $hips],
                    'notes' => $notes,
                ], null);
            }
        }
    }

    /** Ficha do aluno com a carga atual (a da última semana), proporcional ao fator dele. */
    private function program(string $key, float $factor, ?int $daysAgo): array
    {
        $round = fn (float $kg) => $kg > 0 ? max(2, round($kg * $factor / 2) * 2) : 0;
        $plan = fn (string $name, string $color, array $exercises) => [
            'name' => $name,
            'color' => $color,
            'exercises' => array_map(fn ($e) => [
                'exercise_id' => $e[0], 'sets' => $e[1], 'rep_min' => $e[2], 'rep_max' => $e[3],
                'load_kg' => $round($e[4]), 'rest_sec' => 90, 'increment_kg' => 2.5, 'notes' => $e[5] ?? null,
            ], $exercises),
        ];

        // O aluno sumido está com a ficha vencida, para aparecer nos alertas do painel.
        $dates = $daysAgo !== null && $daysAgo > 14
            ? ['starts_on' => today()->subWeeks(7)->toDateString(), 'expires_on' => today()->subDays(3)->toDateString()]
            : ['starts_on' => today()->subWeeks(6)->toDateString(), 'expires_on' => today()->addWeeks(4)->toDateString()];

        return $dates + match ($key) {
            'abc' => [
                'name' => 'Hipertrofia ABC',
                'notes' => 'Aquecer 10 minutos antes. Beber água entre os exercícios.',
                'plans' => [
                    $plan('Treino A · Peito e tríceps', 'lime', [
                        ['Barbell_Bench_Press_-_Medium_Grip', 4, 8, 10, 40, 'Escápulas encaixadas, desça até o peito.'],
                        ['Incline_Dumbbell_Press', 3, 10, 12, 16],
                        ['Cable_Crossover', 3, 12, 15, 15, 'Movimento lento na volta.'],
                        ['Triceps_Pushdown', 3, 10, 12, 25],
                    ]),
                    $plan('Treino B · Costas e bíceps', 'cyan', [
                        ['Wide-Grip_Lat_Pulldown', 4, 8, 12, 45, 'Puxe até o queixo, sem balançar o tronco.'],
                        ['Bent_Over_Barbell_Row', 3, 8, 10, 35],
                        ['Seated_Cable_Rows', 3, 10, 12, 40],
                        ['Hammer_Curls', 3, 10, 12, 12],
                    ]),
                    $plan('Treino C · Pernas e ombros', 'orange', [
                        ['Barbell_Squat', 4, 8, 10, 60, 'Joelhos alinhados com a ponta dos pés. Desça em 3 segundos.'],
                        ['Leg_Press', 3, 10, 12, 120],
                        ['Lying_Leg_Curls', 3, 10, 12, 30],
                        ['Side_Lateral_Raise', 3, 12, 15, 8],
                    ]),
                ],
            ],
            'fullbody' => [
                'name' => 'Full Body iniciante',
                'notes' => 'Três vezes por semana, com um dia de descanso entre os treinos.',
                'plans' => [
                    $plan('Treino único', 'emerald', [
                        ['Leg_Press', 3, 12, 15, 80],
                        ['Machine_Bench_Press', 3, 12, 15, 20],
                        ['Seated_Cable_Rows', 3, 12, 15, 30],
                        ['Seated_Dumbbell_Press', 3, 12, 15, 8],
                        ['Plank', 3, 30, 45, 0, 'Segundos, não repetições.'],
                    ]),
                ],
            ],
            'upperlower' => [
                'name' => 'Superior e inferior',
                'notes' => 'Alternar os treinos, quatro vezes por semana.',
                'plans' => [
                    $plan('Superior', 'violet', [
                        ['Dumbbell_Shoulder_Press', 3, 8, 12, 14],
                        ['Wide-Grip_Lat_Pulldown', 3, 10, 12, 40],
                        ['Incline_Dumbbell_Press', 3, 10, 12, 14],
                        ['Barbell_Curl', 3, 10, 12, 18],
                    ]),
                    $plan('Inferior', 'pink', [
                        ['Barbell_Hip_Thrust', 4, 10, 12, 60, 'Segure 1 segundo no alto.'],
                        ['Romanian_Deadlift', 3, 10, 12, 40],
                        ['Dumbbell_Lunges', 3, 10, 12, 10],
                        ['Leg_Extensions', 3, 12, 15, 35],
                    ]),
                ],
            ],
        };
    }

    /** Números fictícios em sequência: 11 90000-0001, 11 90000-0002... */
    private function phone(int $n): string
    {
        return sprintf('119000000%02d', $n);
    }
}
