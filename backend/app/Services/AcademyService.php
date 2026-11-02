<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AcademyService
{
    public function __construct(private readonly AcademyRepository $academies) {}

    /** Cria a academia e vincula o dono. O dono é criado se o e-mail ainda não existir. */
    public function createWithOwner(string $name, User $owner): Academy
    {
        return DB::transaction(function () use ($name, $owner) {
            $academy = $this->academies->create($name, $this->uniqueSlug($name));
            $this->academies->addMember($academy, $owner, Role::Owner);

            if ($owner->current_academy_id === null) {
                $owner->forceFill(['current_academy_id' => $academy->id])->save();
            }

            return $academy;
        });
    }

    public function addMember(Academy $academy, User $user, Role $role): void
    {
        $this->academies->addMember($academy, $user, $role);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'academia';
        $slug = $base;

        for ($i = 2; $this->academies->slugExists($slug); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
