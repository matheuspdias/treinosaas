<?php

namespace App\Repositories\Eloquent;

use App\Enums\StudentStatus;
use App\Models\Student;
use App\Repositories\Contracts\StudentRepository;
use App\Support\PhoneNumber;
use App\Tenancy\AcademyScope;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
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

    public function paginate(?string $search, ?StudentStatus $status, int $perPage = 20): LengthAwarePaginator
    {
        return Student::query()
            ->whereNull('anonymized_at')
            ->with(['programs' => fn ($q) => $q->active()->latest()])
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->when($search, function (Builder $q, string $search) {
                $digits = preg_replace('/\D+/', '', $search);
                $q->where(function (Builder $q) use ($search, $digits) {
                    $q->whereRaw('unaccent_lower(name) like unaccent_lower(?)', ['%'.$search.'%']);
                    if (strlen($digits) >= 4) {
                        $q->orWhere('phone', 'like', '%'.$digits.'%');
                    }
                });
            })
            ->orderByRaw('unaccent_lower(name)')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function activeByIds(array $ids): Collection
    {
        return Student::query()->whereKey($ids)->where('status', StudentStatus::Active)->get();
    }

    public function allActive(): Collection
    {
        return Student::query()->where('status', StudentStatus::Active)->orderBy('name')->get(['id', 'name']);
    }

    public function save(Student $student): Student
    {
        $student->save();

        return $student;
    }

    public function countActive(): int
    {
        return Student::query()->where('status', StudentStatus::Active)->count();
    }

    public function missingSince(CarbonInterface $since, int $limit = 50): Collection
    {
        return Student::query()
            ->where('status', StudentStatus::Active)
            ->where(fn (Builder $q) => $q
                ->where('last_workout_at', '<', $since)
                ->orWhere(fn (Builder $q) => $q->whereNull('last_workout_at')->where('created_at', '<', $since)))
            ->orderByRaw('last_workout_at asc nulls first')
            ->limit($limit)
            ->get();
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
