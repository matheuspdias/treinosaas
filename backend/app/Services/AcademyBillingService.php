<?php

namespace App\Services;

use App\Models\Academy;
use App\Models\User;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Criação de academias pelo admin e os dados de assinatura (plano, ciclo, fundador, teste). */
class AcademyBillingService
{
    public function __construct(
        private readonly AcademyService $academies,
        private readonly AcademyRepository $repository,
        private readonly FounderProgramService $founders,
    ) {}

    /**
     * Cria a academia e o dono (se o e-mail ainda não existir, com senha provisória).
     *
     * @param  array{plan_tier: string, billing_cycle: string, is_founder: bool, founder_since?: string|null, trial_ends_at?: string|null}  $billing
     * @return array{academy: Academy, owner: User, password: string|null}
     */
    public function create(string $name, string $ownerEmail, ?string $ownerName, array $billing): array
    {
        return DB::transaction(function () use ($name, $ownerEmail, $ownerName, $billing) {
            $password = null;
            $owner = User::query()->where('email', $ownerEmail)->first();

            if ($owner === null) {
                $password = Str::password(14, symbols: false);
                $owner = User::query()->create(['name' => $ownerName ?: $ownerEmail, 'email' => $ownerEmail, 'password' => $password]);
                $owner->forceFill(['email_verified_at' => now()])->save();
            }

            $academy = $this->academies->createWithOwner($name, $owner);
            $this->update($academy, $billing);

            return ['academy' => $academy, 'owner' => $owner, 'password' => $password];
        });
    }

    /**
     * @param  array{plan_tier: string, billing_cycle: string, is_founder: bool, founder_since?: string|null, trial_ends_at?: string|null}  $billing
     */
    public function update(Academy $academy, array $billing): Academy
    {
        $becomesFounder = $billing['is_founder'] && ! $academy->is_founder;

        if ($becomesFounder && ! $this->founders->hasSpot()) {
            throw ValidationException::withMessages(['is_founder' => 'As vagas do Programa Fundadores estão esgotadas.']);
        }

        $academy->forceFill([
            'plan_tier' => $billing['plan_tier'],
            'billing_cycle' => $billing['billing_cycle'],
            'is_founder' => $billing['is_founder'],
            'founder_since' => $billing['is_founder'] ? ($billing['founder_since'] ?? null) ?: ($academy->founder_since ?? today()) : null,
            'trial_ends_at' => $billing['trial_ends_at'] ?? null,
        ]);

        $founderChanged = $academy->isDirty('is_founder');
        $this->repository->save($academy);

        if ($founderChanged) {
            $this->founders->forget();
        }

        return $academy;
    }
}
