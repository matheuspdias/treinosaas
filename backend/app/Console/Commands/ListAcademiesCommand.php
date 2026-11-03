<?php

namespace App\Console\Commands;

use App\Models\Academy;
use App\Repositories\Contracts\AcademyRepository;
use Illuminate\Console\Command;

class ListAcademiesCommand extends Command
{
    protected $signature = 'academy:list';

    protected $description = 'Lista as academias e a situação de cada uma';

    public function handle(AcademyRepository $academies): int
    {
        $this->table(
            ['Nome', 'Slug', 'Situação', 'Motivo'],
            $academies->all()->map(fn (Academy $a) => [
                $a->name,
                $a->slug,
                match (true) {
                    ! $a->isActive() => 'Desativada',
                    $a->isSuspended() => 'Suspensa desde '.$a->suspended_at->format('d/m/Y'),
                    default => 'Ativa',
                },
                $a->suspension_reason ?? '',
            ])->all(),
        );

        return self::SUCCESS;
    }
}
