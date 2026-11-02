<?php

namespace App\Services;

use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Repositories\Contracts\WorkoutRepository;
use App\Tenancy\TenantContext;
use Illuminate\Support\Carbon;

class DashboardService
{
    public const MISSING_DAYS_OPTIONS = [7, 14, 30];

    public function __construct(
        private readonly StudentRepository $students,
        private readonly ProgramRepository $programs,
        private readonly WorkoutRepository $workouts,
        private readonly TenantContext $context,
    ) {}

    /** @return array<string, mixed> */
    public function summary(int $missingDays = 7): array
    {
        $tz = $this->context->academy()->timezone;
        $now = Carbon::now($tz);
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY)->utc();
        $chartStart = $now->copy()->subDays(13)->startOfDay();
        $daily = $this->workouts->dailyCountsSince($chartStart->copy()->utc());

        return [
            'stats' => [
                'activeStudents' => $this->students->countActive(),
                'workoutsThisWeek' => $this->workouts->countSince($weekStart),
                'expiredPrograms' => $this->programs->countExpired(),
            ],
            'daily' => collect(range(0, 13))->map(function (int $offset) use ($chartStart, $daily) {
                $day = $chartStart->copy()->addDays($offset)->toDateString();

                return ['day' => $day, 'total' => $daily[$day] ?? 0];
            })->all(),
            'expiring' => $this->programs->expiringUntil(today($tz)->addDays(7))->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'expiresOn' => $p->expires_on->toDateString(),
                'expired' => $p->isExpired(),
                'student' => ['id' => $p->student->id, 'name' => $p->student->name],
            ])->all(),
            'missingDays' => $missingDays,
            'missing' => $this->students->missingSince($now->copy()->subDays($missingDays)->utc())->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'lastWorkoutAt' => $s->last_workout_at?->toIso8601String(),
            ])->all(),
        ];
    }
}
