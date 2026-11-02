<?php

namespace App\Repositories\Eloquent;

use App\Models\Assessment;
use App\Models\Student;
use App\Repositories\Contracts\AssessmentRepository;
use Illuminate\Support\Collection;

class EloquentAssessmentRepository implements AssessmentRepository
{
    public function forStudent(Student $student): Collection
    {
        return $student->assessments()->with('author:id,name')->latest('assessed_on')->latest()->get();
    }

    public function create(Student $student, array $attributes, ?int $createdBy): Assessment
    {
        $assessment = new Assessment($attributes);
        $assessment->student_id = $student->id;
        $assessment->created_by = $createdBy;
        $assessment->save();

        return $assessment;
    }

    public function update(Assessment $assessment, array $attributes): Assessment
    {
        $assessment->fill($attributes)->save();

        return $assessment;
    }

    public function delete(Assessment $assessment): void
    {
        $assessment->delete();
    }
}
