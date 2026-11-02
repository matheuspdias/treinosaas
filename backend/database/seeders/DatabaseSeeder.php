<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\Student;
use App\Models\User;
use App\Services\AcademyService;
use App\Tenancy\TenantContext;
use Illuminate\Database\Seeder;

/**
 * Dados de desenvolvimento: duas academias para ver o isolamento na prática.
 * Todas as senhas: "password".
 */
class DatabaseSeeder extends Seeder
{
    public function run(AcademyService $academies, TenantContext $context): void
    {
        $owner = User::factory()->create(['name' => 'Dono Demo', 'email' => 'dono@demo.test']);
        $instructor = User::factory()->create(['name' => 'Instrutor Demo', 'email' => 'instrutor@demo.test']);
        $otherOwner = User::factory()->create(['name' => 'Dono Outra', 'email' => 'dono@outra.test']);

        $demo = $academies->createWithOwner('Academia Demo', $owner);
        $academies->addMember($demo, $instructor, Role::Instructor);
        $instructor->forceFill(['current_academy_id' => $demo->id])->save();

        $other = $academies->createWithOwner('Academia Outra', $otherOwner);

        $this->students($context, $demo, ['11987654321' => 'Ana Souza', '11976543210' => 'Bruno Lima']);
        $this->students($context, $other, ['21987654321' => 'Carla Dias']);
    }

    /** @param array<string, string> $students telefone => nome */
    private function students(TenantContext $context, Academy $academy, array $students): void
    {
        $context->run($academy, function () use ($students) {
            foreach ($students as $phone => $name) {
                Student::factory()->create(['name' => $name, 'phone' => $phone]);
            }
        });
    }
}
