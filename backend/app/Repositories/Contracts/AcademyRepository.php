<?php

namespace App\Repositories\Contracts;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

interface AcademyRepository
{
    public function slugExists(string $slug): bool;

    public function create(string $name, string $slug): Academy;

    public function addMember(Academy $academy, User $user, Role $role): void;

    public function findBySlug(string $slug): ?Academy;

    /** @return Collection<int, Academy> */
    public function all(): Collection;

    public function save(Academy $academy): Academy;

    public function find(string $id): ?Academy;

    /** Para o painel de admin: todas, com `active_students_count` (atravessa as academias). */
    public function allWithActiveStudentCount(): Collection;

    public function activeStudentCount(Academy $academy): int;

    public function countFounders(): int;

    /**
     * Fundadoras que perderam o direito: desativadas (cancelaram) ou suspensas há mais de X dias.
     *
     * @return Collection<int, Academy>
     */
    public function lapsedFounders(CarbonInterface $suspendedBefore): Collection;
}
