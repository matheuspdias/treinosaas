<?php

namespace App\Repositories\Contracts;

use App\Enums\StudentStatus;
use App\Models\Student;
use App\Support\PhoneNumber;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/** Sempre restrito à academia atual, exceto onde o nome do método diz o contrário. */
interface StudentRepository
{
    public function find(string $id): ?Student;

    public function findByPhone(PhoneNumber $phone): ?Student;

    /** @return LengthAwarePaginator<int, Student> */
    public function paginate(?string $search, ?StudentStatus $status, int $perPage = 20): LengthAwarePaginator;

    /** @return Collection<int, Student> */
    public function activeByIds(array $ids): Collection;

    /** @return Collection<int, Student> */
    public function allActive(): Collection;

    public function save(Student $student): Student;

    public function countActive(): int;

    /**
     * Ativos que não treinam desde `$since` (ou nunca treinaram e foram cadastrados antes disso).
     *
     * @return Collection<int, Student>
     */
    public function missingSince(CarbonInterface $since, int $limit = 50): Collection;

    /**
     * Único acesso entre academias: o login do aluno só conhece o telefone.
     *
     * @return Collection<int, Student>
     */
    public function findInAnyAcademyByPhone(PhoneNumber $phone): Collection;
}
