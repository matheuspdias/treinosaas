<?php

namespace App\Services;

use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use App\Repositories\Contracts\ProgramRepository;
use App\Repositories\Contracts\StudentRepository;
use App\Support\Catalog\ExerciseCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Programas (treinos) da academia: modelos reutilizáveis e treinos dedicados a um aluno.
 *
 * Estrutura recebida do editor:
 *   plans: [{ id?, name, color, exercises: [{ id?, exercise_id, sets, rep_min, rep_max, load_kg, rest_sec, increment_kg, notes }] }]
 */
class ProgramService
{
    public function __construct(
        private readonly ProgramRepository $programs,
        private readonly StudentRepository $students,
        private readonly ExerciseCatalog $catalog,
    ) {}

    /** Sem autor: modelo criado pelo sistema (ex.: modelos prontos de uma academia nova). */
    public function createTemplate(array $data, ?User $author): Program
    {
        return DB::transaction(function () use ($data, $author) {
            $program = $this->programs->create($this->attributes($data), null, $author?->id);
            $this->programs->replaceStructure($program, $this->structure($data['plans']));

            return $program;
        });
    }

    /** Treino dedicado: por padrão substitui (arquiva) o treino atual do aluno. */
    public function createForStudent(Student $student, array $data, User $author, bool $replaceCurrent = true): Program
    {
        return DB::transaction(function () use ($student, $data, $author, $replaceCurrent) {
            $program = $this->programs->create($this->attributes($data), $student, $author->id);
            $this->programs->replaceStructure($program, $this->structure($data['plans']));

            if ($replaceCurrent) {
                $this->programs->archiveActiveForStudent($student, except: $program);
            }

            return $program;
        });
    }

    public function update(Program $program, array $data): Program
    {
        return DB::transaction(function () use ($program, $data) {
            $this->programs->update($program, $this->attributes($data));
            $this->programs->replaceStructure($program, $this->structure($data['plans']));

            // Treino de aluno alterado: o app avisa "seu treino foi atualizado".
            if (! $program->isTemplate()) {
                $program->forceFill(['seen_at' => null])->save();
            }

            return $program;
        });
    }

    /**
     * Aplica um modelo a vários alunos: cada um recebe a própria cópia, que pode ser ajustada depois.
     *
     * @param  list<string>  $studentIds
     * @param  array{starts_on?: ?string, expires_on?: ?string, replace_current?: bool}  $options
     * @return int quantos alunos receberam
     */
    public function assignTemplate(Program $template, array $studentIds, User $author, array $options = []): int
    {
        if (! $template->isTemplate()) {
            throw ValidationException::withMessages(['program' => 'Só modelos podem ser aplicados a vários alunos.']);
        }

        $students = $this->students->activeByIds($studentIds);
        $structure = $this->copyStructure($template);
        $attributes = [
            'name' => $template->name,
            'notes' => $template->notes,
            'starts_on' => $options['starts_on'] ?? today()->toDateString(),
            'expires_on' => $options['expires_on'] ?? null,
        ];

        DB::transaction(function () use ($students, $structure, $attributes, $template, $author, $options) {
            foreach ($students as $student) {
                $program = $this->programs->create($attributes, $student, $author->id, $template);
                $this->programs->replaceStructure($program, $structure);

                if ($options['replace_current'] ?? true) {
                    $this->programs->archiveActiveForStudent($student, except: $program);
                }
            }
        });

        return $students->count();
    }

    /** Transforma o treino de um aluno num modelo novo da academia. */
    public function saveAsTemplate(Program $program, User $author): Program
    {
        return DB::transaction(function () use ($program, $author) {
            $template = $this->programs->create(
                ['name' => $program->name, 'notes' => $program->notes],
                null,
                $author->id,
            );
            $this->programs->replaceStructure($template, $this->copyStructure($program));

            return $template;
        });
    }

    public function archive(Program $program): void
    {
        $this->programs->archive($program);
    }

    public function delete(Program $program): void
    {
        $this->programs->delete($program);
    }

    /** @return array<string, mixed> */
    private function attributes(array $data): array
    {
        return [
            'name' => trim($data['name']),
            'notes' => $data['notes'] ?? null,
            'starts_on' => $data['starts_on'] ?? null,
            'expires_on' => $data['expires_on'] ?? null,
        ];
    }

    /**
     * Valida os exercícios no catálogo e guarda o nome em pt-BR.
     *
     * @return list<array<string, mixed>>
     */
    private function structure(array $plans): array
    {
        return array_map(fn (array $plan) => [
            'id' => $plan['id'] ?? null,
            'name' => trim($plan['name']),
            'color' => $plan['color'],
            'exercises' => array_map(function (array $exercise) {
                $name = $this->catalog->name($exercise['exercise_id'])
                    ?? throw ValidationException::withMessages(['plans' => 'Exercício desconhecido: '.$exercise['exercise_id']]);

                return [
                    'id' => $exercise['id'] ?? null,
                    'exercise_source' => 'catalog',
                    'exercise_id' => $exercise['exercise_id'],
                    'exercise_name' => $name,
                    'sets' => (int) $exercise['sets'],
                    'rep_min' => (int) $exercise['rep_min'],
                    'rep_max' => max((int) $exercise['rep_min'], (int) $exercise['rep_max']),
                    'load_kg' => (float) ($exercise['load_kg'] ?? 0),
                    'rest_sec' => (int) $exercise['rest_sec'],
                    'increment_kg' => (float) ($exercise['increment_kg'] ?? 2.5),
                    'notes' => filled($exercise['notes'] ?? null) ? trim($exercise['notes']) : null,
                ];
            }, $plan['exercises'] ?? []),
        ], $plans);
    }

    /** Estrutura de um programa existente, sem ids (para virar cópia). */
    private function copyStructure(Program $program): array
    {
        return $program->plans()->with('exercises')->get()->map(fn ($plan) => [
            'name' => $plan->name,
            'color' => $plan->color,
            'exercises' => $plan->exercises->map(fn ($e) => $e->only([
                'exercise_source', 'exercise_id', 'exercise_name', 'sets', 'rep_min', 'rep_max',
                'load_kg', 'rest_sec', 'increment_kg', 'notes',
            ]))->all(),
        ])->all();
    }
}
