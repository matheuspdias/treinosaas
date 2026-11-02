<?php

namespace App\Repositories\Contracts;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;

interface AcademyRepository
{
    public function slugExists(string $slug): bool;

    public function create(string $name, string $slug): Academy;

    public function addMember(Academy $academy, User $user, Role $role): void;
}
