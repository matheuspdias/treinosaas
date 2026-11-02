<?php

namespace App\Http\Requests\Panel;

use Illuminate\Foundation\Http\FormRequest;

class AssignProgramRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'student_ids' => ['required', 'array', 'min:1', 'max:500'],
            'student_ids.*' => ['uuid'],
            'starts_on' => ['nullable', 'date'],
            'expires_on' => ['nullable', 'date', 'after_or_equal:today'],
            'replace_current' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return ['student_ids.required' => 'Escolha pelo menos um aluno.'];
    }
}
