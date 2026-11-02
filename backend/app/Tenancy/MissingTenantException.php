<?php

namespace App\Tenancy;

use RuntimeException;

/** Consulta ou gravação de dado de academia sem academia definida: falha em vez de vazar dados. */
class MissingTenantException extends RuntimeException
{
    public static function for(string $model): self
    {
        return new self("Nenhuma academia definida no contexto ao acessar [{$model}].");
    }
}
