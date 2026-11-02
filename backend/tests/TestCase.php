<?php

namespace Tests;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    /** Pessoa da equipe vinculada a uma academia (criada se não for passada). */
    protected function member(Role $role = Role::Owner, ?Academy $academy = null): User
    {
        $academy ??= Academy::factory()->create();
        $user = User::factory()->create(['current_academy_id' => $academy->id]);
        $academy->members()->attach($user, ['role' => $role->value]);

        return $user;
    }

    /**
     * Executa dentro de uma academia (criar dados com factories, por exemplo).
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    protected function inAcademy(Academy $academy, callable $callback): mixed
    {
        return app(TenantContext::class)->run($academy, $callback);
    }
}
