<?php

namespace App\Models;

use App\Tenancy\AcademyScope;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * O token é o que identifica o aluno: ele precisa ser carregado antes de existir
     * academia no contexto. Quem define a academia depois é o ResolveTenantFromStudent.
     */
    public function tokenable(): MorphTo
    {
        return $this->morphTo('tokenable')->withoutGlobalScope(AcademyScope::class);
    }
}
