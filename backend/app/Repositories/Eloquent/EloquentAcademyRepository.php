<?php

namespace App\Repositories\Eloquent;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Support\Collection;

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
}
