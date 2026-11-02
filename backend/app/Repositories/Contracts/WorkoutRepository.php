<?php

namespace App\Repositories\Contracts;

use App\Models\Student;
use App\Models\WorkoutSession;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface WorkoutRepository
{
    /**
     * Dono de cada id já gravado, em qualquer academia (o id vem do aparelho; evita colisão).
     *
     * @param  list<string>  $ids
     * @return array<string, string> id da sessão => id do aluno
     */
    public function ownersOf(array $ids): array;

    /** @param list<array<string, mixed>> $sets */
    public function create(Student $student, array $session, array $sets): WorkoutSession;

    /** @return Collection<int, WorkoutSession> */
    public function recentForStudent(Student $student, int $limit = 20): Collection;

    /**
     * Evolução por exercício: uma linha por (exercício, treino) com a maior carga e as repetições dela.
     *
     * @return Collection<int, object{exercise_id: string, exercise_source: string, exercise_name: string, day: string, top_weight_kg: float|null, top_reps: int|null, sets: int}>
     */
    public function loadHistory(Student $student, int $days = 180): Collection;

    /** @return list<string> dias (AAAA-MM-DD) com treino desde `$since` */
    public function trainingDays(Student $student, CarbonInterface $since): array;

    public function countSince(CarbonInterface $since): int;

    /** @return array<string, int> dia => treinos, desde `$since` (toda a academia) */
    public function dailyCountsSince(CarbonInterface $since): array;
}
