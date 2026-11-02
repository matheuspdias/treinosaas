<?php

namespace Tests;

use App\Enums\Role;
use App\Models\Academy;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Services\ProgramService;
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

    /** Exercícios reais do catálogo exportado da PWA. */
    protected const BENCH = 'Barbell_Bench_Press_-_Medium_Grip';

    protected const SQUAT = 'Barbell_Squat';

    /** Estrutura válida para o editor (snake_case, como o painel envia). */
    protected function planPayload(string $name = 'Treino A', array $exerciseIds = [self::BENCH]): array
    {
        return [
            'name' => $name,
            'color' => 'lime',
            'exercises' => array_map(fn (string $id) => [
                'exercise_id' => $id,
                'sets' => 3,
                'rep_min' => 8,
                'rep_max' => 12,
                'load_kg' => 40,
                'rest_sec' => 90,
                'increment_kg' => 2.5,
                'notes' => 'Desça controlando',
            ], $exerciseIds),
        ];
    }

    /** Programa com fichas: modelo (sem aluno) ou treino do aluno. */
    protected function program(Academy $academy, ?Student $student = null, array $attributes = []): Program
    {
        return $this->inAcademy($academy, function () use ($student, $attributes, $academy) {
            $author = $academy->members()->first() ?? User::factory()->create();
            $data = ['name' => 'Hipertrofia ABC', 'plans' => [$this->planPayload('Treino A'), $this->planPayload('Treino B', [self::SQUAT])], ...$attributes];
            $service = app(ProgramService::class);

            return $student
                ? $service->createForStudent($student, $data, $author)
                : $service->createTemplate($data, $author);
        });
    }

    protected function student(Academy $academy, array $attributes = []): Student
    {
        return $this->inAcademy($academy, fn () => Student::factory()->create($attributes));
    }
}
