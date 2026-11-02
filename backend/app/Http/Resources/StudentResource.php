<?php

namespace App\Http\Resources;

use App\Enums\Ability;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * Aluno para o painel. Telefone completo só para quem gerencia alunos;
 * para os demais (instrutor), mascarado (LGPD: só o necessário).
 *
 * @mixin Student
 */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canManage = Gate::allows(Ability::ManageStudents->value);
        $program = $this->relationLoaded('programs') ? $this->programs->first() : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phoneMasked' => $this->phone?->masked(),
            'phone' => $this->when($canManage && $request->routeIs('students.show', 'students.edit'), fn () => $this->phone?->formatted()),
            'status' => $this->status->value,
            'access' => $this->accessState(),
            'pinSetAt' => $this->pin_set_at?->toIso8601String(),
            'firstAccessUntil' => $this->first_access_until?->toIso8601String(),
            'lastWorkoutAt' => $this->last_workout_at?->toIso8601String(),
            'createdAt' => $this->created_at->toIso8601String(),
            'program' => $program ? [
                'id' => $program->id,
                'name' => $program->name,
                'expiresOn' => $program->expires_on?->toDateString(),
                'expired' => $program->isExpired(),
            ] : null,
        ];
    }
}
