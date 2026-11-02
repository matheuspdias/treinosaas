<?php

namespace App\Http\Resources;

use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Programa completo (fichas e exercícios) para o editor do painel.
 *
 * @mixin Program
 */
class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'notes' => $this->notes,
            'startsOn' => $this->starts_on?->toDateString(),
            'expiresOn' => $this->expires_on?->toDateString(),
            'isTemplate' => $this->isTemplate(),
            'archived' => $this->archived_at !== null,
            'student' => $this->student ? ['id' => $this->student->id, 'name' => $this->student->name] : null,
            'updatedAt' => $this->updated_at->toIso8601String(),
            'plans' => $this->plans->map(fn ($plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'color' => $plan->color,
                'exercises' => $plan->exercises->map(fn ($e) => [
                    'id' => $e->id,
                    'exerciseId' => $e->exercise_id,
                    'exerciseName' => $e->exercise_name,
                    'sets' => $e->sets,
                    'repMin' => $e->rep_min,
                    'repMax' => $e->rep_max,
                    'loadKg' => $e->load_kg,
                    'restSec' => $e->rest_sec,
                    'incrementKg' => $e->increment_kg,
                    'notes' => $e->notes,
                ])->all(),
            ])->all(),
        ];
    }
}
