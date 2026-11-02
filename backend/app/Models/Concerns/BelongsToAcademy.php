<?php

namespace App\Models\Concerns;

use App\Models\Academy;
use App\Tenancy\AcademyScope;
use App\Tenancy\CrossTenantWriteException;
use App\Tenancy\MissingTenantException;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Para toda entidade que pertence a uma academia (coluna `academy_id`).
 * Leitura filtrada pelo AcademyScope; gravação preenche e confere a academia atual.
 */
trait BelongsToAcademy
{
    public static function bootBelongsToAcademy(): void
    {
        static::addGlobalScope(new AcademyScope);

        static::creating(function (Model $model) {
            $context = app(TenantContext::class);

            if (! $context->check()) {
                throw MissingTenantException::for($model::class);
            }

            $model->academy_id ??= $context->id();

            if ($model->academy_id !== $context->id()) {
                throw CrossTenantWriteException::for($model::class);
            }
        });

        static::updating(function (Model $model) {
            if ($model->isDirty('academy_id')) {
                throw CrossTenantWriteException::for($model::class);
            }
        });
    }

    /** @return BelongsTo<Academy, $this> */
    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }
}
