<?php

namespace App\Repositories\Contracts;

use App\Models\Program;
use App\Models\Student;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface ProgramRepository
{
    public function find(string $id): ?Program;

    /** @return Collection<int, Program> */
    public function templates(?string $search = null): Collection;

    /** @return Collection<int, Program> programas do aluno, ativos primeiro */
    public function forStudent(Student $student): Collection;

    /** @return Collection<int, Program> ativos, com fichas e exercícios (para o app) */
    public function activeWithStructureForStudent(Student $student): Collection;

    public function create(array $attributes, ?Student $student, ?int $createdBy, ?Program $template = null): Program;

    public function update(Program $program, array $attributes): Program;

    /**
     * Substitui fichas e exercícios mantendo os ids enviados (o histórico do app aponta para eles).
     *
     * @param  list<array<string, mixed>>  $plans
     */
    public function replaceStructure(Program $program, array $plans): void;

    public function archiveActiveForStudent(Student $student, ?Program $except = null): void;

    public function archive(Program $program): void;

    public function delete(Program $program): void;

    public function markSeen(Program $program): void;

    /** @return Collection<int, Program> programas de alunos ativos que vencem até `$until` */
    public function expiringUntil(CarbonInterface $until, int $limit = 50): Collection;

    public function countExpired(): int;
}
