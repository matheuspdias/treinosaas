<?php

namespace App\Repositories\Eloquent;

use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use App\Tenancy\AcademyScope;
use Illuminate\Support\Collection;

class EloquentStudentRepository implements StudentRepository
{
    public function find(string $id): ?Student
    {
        return Student::query()->find($id);
    }

    public function findByPhone(PhoneNumber $phone): ?Student
    {
        return Student::query()->where('phone', $phone->e164())->first();
    }

    public function save(Student $student): Student
    {
        $student->save();

        return $student;
    }

    public function findInAnyAcademyByPhone(PhoneNumber $phone): Collection
    {
        return Student::query()
            ->withoutGlobalScope(AcademyScope::class)
            ->with('academy')
            ->where('phone', $phone->e164())
            ->get();
    }
}
