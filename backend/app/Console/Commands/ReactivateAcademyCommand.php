<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\AcademyRepository;
use App\Services\AcademyService;
use Illuminate\Console\Command;

/** Libera de novo os alunos. Quem já estava logado volta a usar o app sem entrar de novo. */
class ReactivateAcademyCommand extends Command
{
    protected $signature = 'academy:reactivate {slug : Slug da academia (veja academy:list)}';

    protected $description = 'Reativa o acesso dos alunos de uma academia suspensa';

    public function handle(AcademyRepository $academies, AcademyService $service): int
    {
        $academy = $academies->findBySlug($this->argument('slug'));

        if ($academy === null) {
            $this->error('Academia não encontrada.');

            return self::FAILURE;
        }

        $service->reactivate($academy);
        $this->info("Acesso dos alunos da \"{$academy->name}\" reativado.");

        return self::SUCCESS;
    }
}
