<?php

namespace App\Tenancy;

use RuntimeException;

class CrossTenantWriteException extends RuntimeException
{
    public static function for(string $model): self
    {
        return new self("Tentativa de gravar [{$model}] em academia diferente da atual.");
    }
}
