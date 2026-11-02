<?php

namespace App\Services;

use App\Models\Student;
use App\Repositories\Contracts\AssessmentRepository;
use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\WorkoutRepository;

/** Tudo o que a ficha do aluno mostra no painel: treinos, frequência, cargas e avaliações. */
class StudentProfileService
{
    public function __construct(
        private readonly ProgramRepository $programs,
        private readonly WorkoutRepository $workouts,
        private readonly AssessmentRepository $assessments,
    ) {}

    /** @return array<string, mixed> */
    public function profile(Student $student): array
    {
        return [
            'programs' => $this->programs->forStudent($student)->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'plansCount' => $p->plans_count,
                'startsOn' => $p->starts_on?->toDateString(),
                'expiresOn' => $p->expires_on?->toDateString(),
                'expired' => $p->isExpired(),
                'archived' => $p->archived_at !== null,
                'seen' => $p->seen_at !== null,
                'createdAt' => $p->created_at->toIso8601String(),
            ])->all(),
            'sessions' => $this->workouts->recentForStudent($student)->map(fn ($s) => [
                'id' => $s->id,
                'planName' => $s->plan_name,
                'finishedAt' => $s->finished_at->toIso8601String(),
                'durationSec' => $s->duration_sec,
                'volumeKg' => $s->volume_kg,
                'setsCount' => $s->sets_count,
            ])->all(),
            'trainingDays' => $this->workouts->trainingDays($student, now()->subDays(84)),
            'loads' => $this->loadsByExercise($student),
            'assessments' => $this->assessments->forStudent($student)->map(fn ($a) => [
                'id' => $a->id,
                'assessedOn' => $a->assessed_on->toDateString(),
                'weightKg' => $a->weight_kg,
                'heightCm' => $a->height_cm,
                'bodyFatPct' => $a->body_fat_pct,
                'measurementsCm' => (object) $a->measurements_cm,
                'notes' => $a->notes,
                'author' => $a->author?->name,
            ])->all(),
        ];
    }

    /** @return list<array<string, mixed>> exercícios mais treinados primeiro, com a evolução de carga */
    private function loadsByExercise(Student $student): array
    {
        return $this->workouts->loadHistory($student)
            ->groupBy(fn ($row) => $row->exercise_source.':'.$row->exercise_id)
            ->map(fn ($rows) => [
                'key' => $rows->first()->exercise_source.':'.$rows->first()->exercise_id,
                'name' => $rows->last()->exercise_name,
                'points' => $rows->sortBy('day')->map(fn ($r) => [
                    'day' => $r->day,
                    'weightKg' => $r->top_weight_kg,
                    'reps' => $r->top_reps,
                    'sets' => (int) $r->sets,
                ])->values()->all(),
            ])
            ->sortByDesc(fn ($e) => count($e['points']))
            ->values()
            ->all();
    }
}
