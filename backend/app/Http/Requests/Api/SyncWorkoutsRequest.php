<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/** Treinos concluídos no formato Session do app (camelCase). */
class SyncWorkoutsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'sessions' => ['required', 'array', 'min:1', 'max:50'],
            'sessions.*.id' => ['required', 'uuid'],
            'sessions.*.planId' => ['nullable', 'string', 'max:64'],
            'sessions.*.planName' => ['required', 'string', 'max:120'],
            'sessions.*.startedAt' => ['required', 'date'],
            'sessions.*.finishedAt' => ['required', 'date', 'before_or_equal:+1 day'],
            'sessions.*.exercises' => ['present', 'array', 'max:60'],
            'sessions.*.exercises.*.planExerciseId' => ['nullable', 'uuid'],
            'sessions.*.exercises.*.exercise.source' => ['required', 'in:catalog,custom,exercisedb'],
            'sessions.*.exercises.*.exercise.id' => ['required', 'string', 'max:150'],
            'sessions.*.exercises.*.exerciseName' => ['required', 'string', 'max:150'],
            'sessions.*.exercises.*.sets' => ['present', 'array', 'max:50'],
            'sessions.*.exercises.*.sets.*.weightKg' => ['nullable', 'numeric', 'between:0,2000'],
            'sessions.*.exercises.*.sets.*.reps' => ['nullable', 'integer', 'between:0,1000'],
            'sessions.*.exercises.*.sets.*.isWarmup' => ['boolean'],
            'sessions.*.exercises.*.sets.*.completedAt' => ['nullable', 'date'],
        ];
    }
}
