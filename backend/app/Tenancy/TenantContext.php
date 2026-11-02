<?php

namespace App\Tenancy;

use App\Enums\Ability;
use App\Enums\Role;
use App\Models\Academy;

/**
 * Academia atual da requisição (ou do job/comando).
 *
 * Definida só pelos middlewares a partir de quem está autenticado, nunca a partir de dado
 * enviado na requisição. Registrada como `scoped`: zera a cada requisição e a cada job.
 */
final class TenantContext
{
    private ?Academy $academy = null;

    /** Papel da pessoa da equipe na academia atual (null para aluno). */
    private ?Role $role = null;

    public function set(Academy $academy, ?Role $role = null): void
    {
        $this->academy = $academy;
        $this->role = $role;
    }

    public function clear(): void
    {
        $this->academy = null;
        $this->role = null;
    }

    public function check(): bool
    {
        return $this->academy !== null;
    }

    public function academy(): Academy
    {
        return $this->academy ?? throw new MissingTenantException('Nenhuma academia definida no contexto.');
    }

    public function id(): string
    {
        return $this->academy()->id;
    }

    public function role(): ?Role
    {
        return $this->role;
    }

    public function allows(Ability $ability): bool
    {
        return $this->role?->can($ability) ?? false;
    }

    /**
     * Executa algo dentro de uma academia (seeders, comandos, jobs) e restaura o contexto anterior.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function run(Academy $academy, callable $callback, ?Role $role = null): mixed
    {
        [$previousAcademy, $previousRole] = [$this->academy, $this->role];
        $this->set($academy, $role);

        try {
            return $callback();
        } finally {
            $this->academy = $previousAcademy;
            $this->role = $previousRole;
        }
    }
}
