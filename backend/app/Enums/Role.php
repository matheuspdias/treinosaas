<?php

namespace App\Enums;

enum Role: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Instructor = 'instructor';

    /** @return list<Ability> */
    public function abilities(): array
    {
        return match ($this) {
            self::Owner => Ability::cases(),
            self::Admin => array_values(array_filter(
                Ability::cases(),
                fn (Ability $ability) => $ability !== Ability::ManageAcademy,
            )),
            // Cria treinos para os alunos, mas não gerencia a academia nem o cadastro de alunos.
            self::Instructor => [
                Ability::ViewDashboard,
                Ability::ViewStudents,
                Ability::ManagePrograms,
                Ability::ViewTraining,
                Ability::ManageAssessments,
            ],
        };
    }

    public function can(Ability $ability): bool
    {
        return in_array($ability, $this->abilities(), true);
    }

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Dono',
            self::Admin => 'Administrador',
            self::Instructor => 'Instrutor',
        };
    }
}
