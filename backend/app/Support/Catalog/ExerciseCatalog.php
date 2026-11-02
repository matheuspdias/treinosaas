<?php

namespace App\Support\Catalog;

use Illuminate\Support\Facades\Cache;

/**
 * Catálogo de exercícios do app (exportado por `npm run catalog:backend` na PWA).
 * Usado para validar exercícios recebidos e guardar o nome em pt-BR.
 */
class ExerciseCatalog
{
    public const PATH = 'catalog/exercises.json';

    /** @var array<string, array{id: string, name: string}>|null */
    private ?array $byId = null;

    public function exists(string $id): bool
    {
        return isset($this->index()[$id]);
    }

    public function name(string $id): ?string
    {
        return $this->index()[$id]['name'] ?? null;
    }

    public static function file(): string
    {
        return resource_path(self::PATH);
    }

    /** @return array<string, array{id: string, name: string}> */
    private function index(): array
    {
        return $this->byId ??= Cache::rememberForever(
            'exercise-catalog:'.filemtime(self::file()),
            function () {
                $data = json_decode((string) file_get_contents(self::file()), true, flags: JSON_THROW_ON_ERROR);

                return collect($data['exercises'])
                    ->mapWithKeys(fn (array $ex) => [$ex['id'] => ['id' => $ex['id'], 'name' => $ex['name']]])
                    ->all();
            },
        );
    }
}
