<?php

namespace App\Repositories\Contracts;

use App\Models\Student;
use App\Support\PhoneNumber;
use Illuminate\Support\Collection;

/** Sempre restrito à academia atual, exceto onde o nome do método diz o contrário. */
interface StudentRepository
{
    public function find(string $id): ?Student;

    public function findByPhone(PhoneNumber $phone): ?Student;

    public function save(Student $student): Student;

    /**
     * Único acesso entre academias: o login do aluno só conhece o telefone.
     *
     * @return Collection<int, Student>
     */
    public function findInAnyAcademyByPhone(PhoneNumber $phone): Collection;
}
