<?php

namespace App\Tenancy;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Filtra toda consulta pela academia atual. Sem academia no contexto, lança exceção
 * (falha fechada). Remover este scope só em repositórios, em pontos documentados.
 */
class AcademyScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(TenantContext::class);

        if (! $context->check()) {
            throw MissingTenantException::for($model::class);
        }

        $builder->where($model->qualifyColumn('academy_id'), $context->id());
    }
}
