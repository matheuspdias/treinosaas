<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\AcademyRepository;
use App\Services\AcademyService;
use Illuminate\Console\Command;

/** Academia sem pagar: os alunos veem "fale com a academia" no app até reativar. */
class SuspendAcademyCommand extends Command
{
    protected $signature = 'academy:suspend
        {slug : Slug da academia (veja academy:list)}
        {--reason= : Motivo interno (não aparece para o aluno)}';

    protected $description = 'Suspende o acesso dos alunos de uma academia';

    public function handle(AcademyRepository $academies, AcademyService $service): int
    {
        $academy = $academies->findBySlug($this->argument('slug'));

        if ($academy === null) {
            $this->error('Academia não encontrada.');

            return self::FAILURE;
        }

        $service->suspend($academy, $this->option('reason'));
        $this->info("Acesso dos alunos da \"{$academy->name}\" suspenso.");

        return self::SUCCESS;
    }
}
