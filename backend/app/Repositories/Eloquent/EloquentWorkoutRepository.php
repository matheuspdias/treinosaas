<?php

namespace App\Repositories\Eloquent;

use App\Models\Student;
use App\Models\WorkoutSession;
use App\Repositories\Contracts\WorkoutRepository;
use App\Tenancy\AcademyScope;
use App\Tenancy\TenantContext;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EloquentWorkoutRepository implements WorkoutRepository
{
    public function __construct(private readonly TenantContext $context) {}

    public function ownersOf(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return WorkoutSession::query()
            ->withoutGlobalScope(AcademyScope::class)
            ->whereKey($ids)
            ->pluck('student_id', 'id')
            ->all();
    }

    public function create(Student $student, array $session, array $sets): WorkoutSession
    {
        $model = new WorkoutSession;
        $model->forceFill([...$session, 'student_id' => $student->id])->save();
        $model->sets()->createMany(array_map(fn (array $set) => [...$set, 'student_id' => $student->id], $sets));

        return $model;
    }

    public function recentForStudent(Student $student, int $limit = 20): Collection
    {
        return $student->workoutSessions()->latest('finished_at')->limit($limit)->get();
    }

    public function loadHistory(Student $student, int $days = 180): Collection
    {
        $tz = $this->context->academy()->timezone;

        // Série de trabalho com maior carga (desempate por repetições) de cada exercício em cada dia.
        return collect(DB::select(<<<'SQL'
            SELECT DISTINCT ON (exercise_source, exercise_id, day)
                exercise_source, exercise_id, exercise_name, day,
                weight_kg::float AS top_weight_kg, reps AS top_reps,
                count(*) OVER (PARTITION BY exercise_source, exercise_id, day) AS sets
            FROM (
                SELECT *, to_char(completed_at AT TIME ZONE 'UTC' AT TIME ZONE ?, 'YYYY-MM-DD') AS day
                FROM workout_sets
                WHERE academy_id = ? AND student_id = ? AND is_warmup = false AND completed_at >= ?
            ) s
            ORDER BY exercise_source, exercise_id, day, weight_kg DESC NULLS LAST, reps DESC NULLS LAST
        SQL, [$tz, $this->context->id(), $student->id, now()->subDays($days)]));
    }

    public function trainingDays(Student $student, CarbonInterface $since): array
    {
        $tz = $this->context->academy()->timezone;

        return $student->workoutSessions()
            ->where('finished_at', '>=', $since)
            ->selectRaw("distinct to_char(finished_at at time zone 'UTC' at time zone ?, 'YYYY-MM-DD') as day", [$tz])
            ->orderBy('day')
            ->pluck('day')
            ->all();
    }

    public function countSince(CarbonInterface $since): int
    {
        return WorkoutSession::query()->where('finished_at', '>=', $since)->count();
    }

    public function dailyCountsSince(CarbonInterface $since): array
    {
        $tz = $this->context->academy()->timezone;

        return WorkoutSession::query()
            ->where('finished_at', '>=', $since)
            ->selectRaw("to_char(finished_at at time zone 'UTC' at time zone ?, 'YYYY-MM-DD') as day, count(*) as total", [$tz])
            ->groupBy('day')
            ->pluck('total', 'day')
            ->map(fn ($total) => (int) $total)
            ->all();
    }
}
