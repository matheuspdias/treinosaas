<?php

namespace App\Repositories\Eloquent;

use App\Enums\Role;
use App\Enums\StudentStatus;
use App\Models\Academy;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EloquentAcademyRepository implements AcademyRepository
{
    public function slugExists(string $slug): bool
    {
        return Academy::query()->where('slug', $slug)->exists();
    }

    public function create(string $name, string $slug): Academy
    {
        return Academy::query()->create(['name' => $name, 'slug' => $slug]);
    }

    public function addMember(Academy $academy, User $user, Role $role): void
    {
        $academy->members()->syncWithoutDetaching([$user->id => ['role' => $role->value]]);
    }

    public function findBySlug(string $slug): ?Academy
    {
        return Academy::query()->where('slug', $slug)->first();
    }

    public function all(): Collection
    {
        return Academy::query()->orderBy('name')->get();
    }

    public function save(Academy $academy): Academy
    {
        $academy->save();

        return $academy;
    }

    public function find(string $id): ?Academy
    {
        return Academy::query()->find($id);
    }

    public function allWithActiveStudentCount(): Collection
    {
        return Academy::query()
            ->select('academies.*')
            ->selectSub(fn (Builder $q) => $this->activeStudents($q)->whereColumn('students.academy_id', 'academies.id'), 'active_students_count')
            ->orderBy('name')
            ->get();
    }

    public function activeStudentCount(Academy $academy): int
    {
        return $this->activeStudents(DB::query())->where('academy_id', $academy->id)->count();
    }

    public function countFounders(): int
    {
        return Academy::query()->where('is_founder', true)->count();
    }

    public function lapsedFounders(CarbonInterface $suspendedBefore): Collection
    {
        return Academy::query()
            ->where('is_founder', true)
            ->where(fn ($q) => $q->whereNotNull('deactivated_at')->orWhere('suspended_at', '<', $suspendedBefore))
            ->get();
    }

    /** Alunos ativos (o que conta para a faixa do plano), direto na tabela: o admin atravessa as academias. */
    private function activeStudents(Builder $query): Builder
    {
        return $query->from('students')
            ->selectRaw('count(*)')
            ->where('status', StudentStatus::Active->value)
            ->whereNull('anonymized_at');
    }
}
