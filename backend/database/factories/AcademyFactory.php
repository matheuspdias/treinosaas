<?php

namespace Database\Factories;

use App\Models\Academy;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Academy> */
class AcademyFactory extends Factory
{
    public function definition(): array
    {
        $name = 'Academia '.fake()->unique()->lastName();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
        ];
    }
}
