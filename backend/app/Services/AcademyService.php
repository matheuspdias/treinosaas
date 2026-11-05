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
    public function __construct(
        private readonly AcademyRepository $academies,
        private readonly ReadyTemplateService $readyTemplates,
    ) {}

    /**
     * Cria a academia e vincula o dono. O dono é criado se o e-mail ainda não existir.
     * A academia já nasce com os modelos prontos do app (ABC, ABCD...), para ajustar à vontade.
     */
    public function createWithOwner(string $name, User $owner): Academy
    {
        return DB::transaction(function () use ($name, $owner) {
            $academy = $this->academies->create($name, $this->uniqueSlug($name));
            $this->academies->addMember($academy, $owner, Role::Owner);

            if ($owner->current_academy_id === null) {
                $owner->forceFill(['current_academy_id' => $academy->id])->save();
            }

            $this->readyTemplates->install($academy, $owner);

            return $academy;
        });
    }

    public function addMember(Academy $academy, User $user, Role $role): void
    {
        $this->academies->addMember($academy, $user, $role);
    }

    /** Bloqueia o acesso dos alunos (ex.: mensalidade em atraso). As sessões ficam guardadas para a reativação. */
    public function suspend(Academy $academy, ?string $reason = null): Academy
    {
        $academy->forceFill([
            'suspended_at' => $academy->suspended_at ?? now(),
            'suspension_reason' => $reason,
        ]);

        return $this->academies->save($academy);
    }

    public function reactivate(Academy $academy): Academy
    {
        $academy->forceFill(['suspended_at' => null, 'suspension_reason' => null]);

        return $this->academies->save($academy);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'academia';
        $slug = $base;

        $taken = fn (string $slug) => in_array($slug, config('treino.reserved_slugs'), true)
            || $this->academies->slugExists($slug);

        for ($i = 2; $taken($slug); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
