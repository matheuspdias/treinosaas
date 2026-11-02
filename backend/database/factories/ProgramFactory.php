<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Cria dentro da academia atual do TenantContext. Para estrutura (fichas/exercícios) use
 * ProgramService ou o helper `program()` dos testes.
 *
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    public function definition(): array
    {
        return ['name' => 'Hipertrofia '.fake()->randomElement(['ABC', 'AB', 'ABCD'])];
    }
}
