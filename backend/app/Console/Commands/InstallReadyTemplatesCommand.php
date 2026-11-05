<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\AcademyRepository;
use App\Services\ReadyTemplateService;
use Illuminate\Console\Command;

/** Para academias criadas antes dos modelos prontos (as novas já recebem). Não duplica. */
class InstallReadyTemplatesCommand extends Command
{
    protected $signature = 'academy:ready-templates
        {slug? : Slug da academia (veja academy:list)}
        {--all : Todas as academias}';

    protected $description = 'Adiciona os modelos prontos (ABC, ABCD, Full Body, Upper / Lower) aos modelos da academia';

    public function handle(AcademyRepository $academies, ReadyTemplateService $service): int
    {
        if ($this->option('all')) {
            $targets = $academies->all();
        } else {
            $academy = $this->argument('slug') ? $academies->findBySlug($this->argument('slug')) : null;

            if ($academy === null) {
                $this->error('Informe o slug de uma academia (veja academy:list) ou use --all.');

                return self::FAILURE;
            }

            $targets = [$academy];
        }

        foreach ($targets as $academy) {
            $created = $service->install($academy);
            $this->info("{$academy->name}: {$created} ".($created === 1 ? 'modelo criado' : 'modelos criados').'.');
        }

        return self::SUCCESS;
    }
}
