<?php

namespace App\Services;

use App\Models\Academy;
use App\Models\User;
use App\Repositories\Contracts\ProgramRepository;
use App\Support\Catalog\ReadyTemplates;
use App\Tenancy\TenantContext;

/** Coloca os modelos prontos do app (ABC, ABCD...) entre os modelos de uma academia. */
class ReadyTemplateService
{
    public function __construct(
        private readonly ReadyTemplates $ready,
        private readonly ProgramService $programs,
        private readonly ProgramRepository $repository,
        private readonly TenantContext $context,
    ) {}

    /**
     * Cria os que a academia ainda não tem (pelo nome, entre os modelos ativos).
     * Rodar de novo não duplica; um modelo arquivado pelo dono volta.
     *
     * @return int quantos foram criados
     */
    public function install(Academy $academy, ?User $author = null): int
    {
        return $this->context->run($academy, function () use ($author) {
            $existing = $this->repository->templates()->pluck('name')->all();
            $created = 0;

            foreach ($this->ready->all() as $template) {
                if (in_array($template['name'], $existing, true)) {
                    continue;
                }

                $this->programs->createTemplate($template, $author);
                $created++;
            }

            return $created;
        });
    }
}
