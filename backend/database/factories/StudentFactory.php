<?php

namespace Database\Factories;

use App\Enums\StudentStatus;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Cria dentro da academia atual do TenantContext (use TenantContext::run ou o helper dos testes).
 *
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '119'.fake()->unique()->numerify('########'),
            'status' => StudentStatus::Active,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => StudentStatus::Inactive]);
    }
}
