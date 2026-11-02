<?php

namespace App\Services;

use App\Models\ProgramPlan;
use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Repositories\Contracts\WorkoutRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Recebe os treinos concluídos que o app enviou (fila offline). Idempotente pelo id da sessão,
 * que é gerado no aparelho: reenviar o mesmo treino não duplica.
 */
class WorkoutSyncService
{
    public function __construct(
        private readonly WorkoutRepository $workouts,
        private readonly StudentRepository $students,
    ) {}

    /**
     * @param  list<array<string, mixed>>  $sessions  validados por SyncWorkoutsRequest (formato Session do app, camelCase)
     * @return array{accepted: list<string>, rejected: list<string>}
     */
    public function ingest(Student $student, array $sessions): array
    {
        $owners = $this->workouts->ownersOf(array_column($sessions, 'id'));
        $plans = $this->studentPlans($student, array_filter(array_column($sessions, 'planId')));
        $accepted = [];
        $rejected = [];
        $lastWorkout = $student->last_workout_at;

        DB::transaction(function () use ($student, $sessions, $owners, $plans, &$accepted, &$rejected, &$lastWorkout) {
            foreach ($sessions as $session) {
                $id = $session['id'];

                if (isset($owners[$id])) {
                    // Já recebido: confirma de novo para o app limpar a fila. Id de outro aluno: recusa.
                    $owners[$id] === $student->id ? $accepted[] = $id : $rejected[] = $id;

                    continue;
                }

                [$attributes, $sets] = $this->toRecords($session, $plans);
                $this->workouts->create($student, $attributes, $sets);
                $accepted[] = $id;

                if ($lastWorkout === null || $attributes['finished_at']->gt($lastWorkout)) {
                    $lastWorkout = $attributes['finished_at'];
                }
            }

            if ($lastWorkout !== null && ($student->last_workout_at === null || $lastWorkout->gt($student->last_workout_at))) {
                $student->forceFill(['last_workout_at' => $lastWorkout]);
                $this->students->save($student);
            }
        });

        return ['accepted' => $accepted, 'rejected' => $rejected];
    }

    /**
     * Fichas da academia que pertencem a este aluno (só essas viram vínculo; o resto fica sem programa).
     *
     * @return array<string, ProgramPlan>
     */
    private function studentPlans(Student $student, array $planIds): array
    {
        // Fichas próprias do aluno ficam só no aparelho e podem ter qualquer id: só UUID vira consulta.
        $planIds = array_values(array_filter($planIds, fn ($id) => is_string($id) && Str::isUuid($id)));

        if ($planIds === []) {
            return [];
        }

        return ProgramPlan::query()
            ->whereKey($planIds)
            ->whereHas('program', fn ($q) => $q->where('student_id', $student->id))
            ->get()
            ->keyBy('id')
            ->all();
    }

    /** @param array<string, ProgramPlan> $plans */
    private function toRecords(array $session, array $plans): array
    {
        $plan = $plans[$session['planId'] ?? ''] ?? null;
        $startedAt = Carbon::parse($session['startedAt'])->utc();
        $finishedAt = Carbon::parse($session['finishedAt'])->utc();
        $sets = [];
        $volume = 0.0;

        foreach (array_values($session['exercises']) as $position => $exercise) {
            $setNumber = 0;

            foreach ($exercise['sets'] as $set) {
                if (empty($set['completedAt'])) {
                    continue;
                }

                $weight = isset($set['weightKg']) ? (float) $set['weightKg'] : null;
                $reps = isset($set['reps']) ? (int) $set['reps'] : null;
                $warmup = (bool) ($set['isWarmup'] ?? false);

                if (! $warmup && $weight !== null && $reps !== null) {
                    $volume += $weight * $reps;
                }

                $sets[] = [
                    'program_exercise_id' => $plan ? ($exercise['planExerciseId'] ?? null) : null,
                    'exercise_source' => $exercise['exercise']['source'],
                    'exercise_id' => $exercise['exercise']['id'],
                    'exercise_name' => $exercise['exerciseName'],
                    'exercise_position' => $position,
                    'set_number' => ++$setNumber,
                    'weight_kg' => $weight,
                    'reps' => $reps,
                    'is_warmup' => $warmup,
                    'completed_at' => Carbon::parse($set['completedAt'])->utc(),
                ];
            }
        }

        return [[
            'id' => $session['id'],
            'program_id' => $plan?->program_id,
            'program_plan_id' => $plan?->id,
            'plan_name' => $session['planName'],
            'started_at' => $startedAt,
            'finished_at' => $finishedAt,
            'duration_sec' => max(0, (int) $startedAt->diffInSeconds($finishedAt)),
            'volume_kg' => round($volume, 2),
            'sets_count' => count(array_filter($sets, fn ($s) => ! $s['is_warmup'])),
        ], $sets];
    }
}
