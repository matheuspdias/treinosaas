<?php

namespace App\Repositories\Contracts;

use App\Models\Assessment;
use App\Models\Student;
use Illuminate\Support\Collection;

interface AssessmentRepository
{
    /** @return Collection<int, Assessment> mais recentes primeiro */
    public function forStudent(Student $student): Collection;

    public function create(Student $student, array $attributes, ?int $createdBy): Assessment;

    public function update(Assessment $assessment, array $attributes): Assessment;

    public function delete(Assessment $assessment): void;
}
