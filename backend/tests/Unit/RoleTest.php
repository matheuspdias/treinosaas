<?php

namespace Tests\Unit;

use App\Enums\Ability;
use App\Enums\Role;
use PHPUnit\Framework\TestCase;

class RoleTest extends TestCase
{
    public function test_dono_tem_todas_as_permissoes(): void
    {
        foreach (Ability::cases() as $ability) {
            $this->assertTrue(Role::Owner->can($ability), $ability->value);
        }
    }

    public function test_admin_nao_gerencia_a_academia(): void
    {
        $this->assertFalse(Role::Admin->can(Ability::ManageAcademy));
        $this->assertTrue(Role::Admin->can(Ability::ManageStudents));
    }

    public function test_instrutor_cria_treinos_mas_nao_gerencia_alunos_nem_academia(): void
    {
        $this->assertTrue(Role::Instructor->can(Ability::ManagePrograms));
        $this->assertTrue(Role::Instructor->can(Ability::ViewTraining));
        $this->assertFalse(Role::Instructor->can(Ability::ManageStudents));
        $this->assertFalse(Role::Instructor->can(Ability::ManageAcademy));
        $this->assertFalse(Role::Instructor->can(Ability::ManageNotices));
    }
}
