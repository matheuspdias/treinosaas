<?php

namespace App\Console\Commands;

use App\Services\FounderProgramService;
use Illuminate\Console\Command;

/** Roda todo dia (routes/console.php). Regra completa em FounderProgramService. */
class ReviewFoundersCommand extends Command
{
    protected $signature = 'academy:review-founders';

    protected $description = 'Tira o status de fundador de quem cancelou ou está inadimplente há mais de 30 dias';

    public function handle(FounderProgramService $founders): int
    {
        $revoked = $founders->revokeLapsed();

        foreach ($revoked as $name) {
            $this->warn("{$name}: perdeu o preço de fundador.");
        }

        $this->info(count($revoked) === 0 ? 'Nenhuma academia perdeu o status.' : count($revoked).' academia(s) perderam o status.');

        return self::SUCCESS;
    }
}
