<?php

namespace App\Services;

use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Support\Facades\Cache;

/**
 * Programa Fundadores. As vagas ocupadas são sempre contadas no banco (academias com
 * is_founder): nenhum número é inventado.
 *
 * Regra: o desconto vale enquanto a assinatura estiver ativa. Quem cancela (academia desativada)
 * ou fica mais de `pricing.founder.grace_days` dias inadimplente (suspensa) perde o status, e a
 * vaga volta a ficar livre. Ver revokeLapsed(), rodado todo dia pelo academy:review-founders.
 */
class FounderProgramService
{
    private const CACHE_KEY = 'founder-spots';

    public function __construct(private readonly AcademyRepository $academies) {}

    /** @return array{total: int, taken: int, remaining: int} */
    public function spots(): array
    {
        $total = (int) config('pricing.founder.spots_total');
        $taken = Cache::remember(self::CACHE_KEY, 60, fn () => $this->academies->countFounders());

        return ['total' => $total, 'taken' => $taken, 'remaining' => max(0, $total - $taken)];
    }

    public function hasSpot(): bool
    {
        return $this->spots()['remaining'] > 0;
    }

    /** Chamar sempre que uma academia ganhar ou perder o status. */
    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** @return list<string> nomes das academias que perderam o status */
    public function revokeLapsed(): array
    {
        $lapsed = $this->academies->lapsedFounders(now()->subDays((int) config('pricing.founder.grace_days')));

        foreach ($lapsed as $academy) {
            $academy->forceFill(['is_founder' => false, 'founder_since' => null]);
            $this->academies->save($academy);
        }

        if ($lapsed->isNotEmpty()) {
            $this->forget();
        }

        return $lapsed->pluck('name')->all();
    }
}
