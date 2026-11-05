<?php

namespace App\Support\Catalog;

/**
 * Modelos de treino prontos do app (ABC, Full Body...), exportados por `npm run catalog:backend`
 * na PWA. Toda academia nova recebe uma cópia deles como modelos dela, para ajustar à vontade.
 */
class ReadyTemplates
{
    public const PATH = 'catalog/templates.json';

    /**
     * No formato que o ProgramService recebe do editor (cargas em 0).
     *
     * @return list<array{name: string, notes: null, plans: list<array<string, mixed>>}>
     */
    public function all(): array
    {
        $templates = json_decode(
            (string) file_get_contents(resource_path(self::PATH)),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        return array_map(fn (array $t) => [
            'name' => $t['name'],
            'notes' => null,
            'plans' => array_map(fn (array $plan) => [
                'name' => $plan['name'],
                'color' => $plan['color'],
                'exercises' => array_map(fn (array $e) => [
                    'exercise_id' => $e['exerciseId'],
                    'sets' => $e['sets'],
                    'rep_min' => $e['repMin'],
                    'rep_max' => $e['repMax'],
                    'load_kg' => 0,
                    'rest_sec' => $e['restSec'],
                    'increment_kg' => $e['incrementKg'] ?? 2.5,
                    'notes' => $e['notes'],
                ], $plan['exercises']),
            ], $t['plans']),
        ], $templates);
    }
}
