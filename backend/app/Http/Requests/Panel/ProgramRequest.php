<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProgramRequest extends FormRequest
{
    public const COLORS = ['lime', 'emerald', 'cyan', 'blue', 'violet', 'pink', 'red', 'orange', 'amber'];

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'starts_on' => ['nullable', 'date'],
            'expires_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'replace_current' => ['sometimes', 'boolean'],
            'plans' => ['required', 'array', 'min:1', 'max:10'],
            'plans.*.id' => ['nullable', 'uuid'],
            'plans.*.name' => ['required', 'string', 'max:40'],
            'plans.*.color' => ['required', Rule::in(self::COLORS)],
            'plans.*.exercises' => ['present', 'array', 'max:30'],
            'plans.*.exercises.*.id' => ['nullable', 'uuid'],
            'plans.*.exercises.*.exercise_id' => ['required', 'string', 'max:150'],
            'plans.*.exercises.*.sets' => ['required', 'integer', 'between:1,20'],
            'plans.*.exercises.*.rep_min' => ['required', 'integer', 'between:1,100'],
            'plans.*.exercises.*.rep_max' => ['required', 'integer', 'between:1,100'],
            'plans.*.exercises.*.load_kg' => ['nullable', 'numeric', 'between:0,1000'],
            'plans.*.exercises.*.rest_sec' => ['required', 'integer', 'between:0,900'],
            'plans.*.exercises.*.increment_kg' => ['nullable', 'numeric', 'between:0,50'],
            'plans.*.exercises.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'expires_on' => 'validade',
            'starts_on' => 'início',
            'plans' => 'fichas',
            'plans.*.name' => 'nome da ficha',
            'plans.*.exercises.*.sets' => 'séries',
            'plans.*.exercises.*.rep_min' => 'repetições',
            'plans.*.exercises.*.rep_max' => 'repetições',
            'plans.*.exercises.*.rest_sec' => 'descanso',
            'plans.*.exercises.*.notes' => 'observação',
        ];
    }
}
