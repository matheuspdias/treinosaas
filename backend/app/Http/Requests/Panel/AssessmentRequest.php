<?php

namespace App\Http\Requests\Panel;

use App\Models\Assessment;
use Illuminate\Foundation\Http\FormRequest;

class AssessmentRequest extends FormRequest
{
    public function rules(): array
    {
        $rules = [
            'assessed_on' => ['required', 'date', 'before_or_equal:today'],
            'weight_kg' => ['nullable', 'numeric', 'between:20,400'],
            'height_cm' => ['nullable', 'numeric', 'between:80,250'],
            'body_fat_pct' => ['nullable', 'numeric', 'between:2,75'],
            'measurements_cm' => ['nullable', 'array:'.implode(',', Assessment::MEASURES)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];

        foreach (Assessment::MEASURES as $measure) {
            $rules["measurements_cm.$measure"] = ['nullable', 'numeric', 'between:10,250'];
        }

        return $rules;
    }

    /** @return array<string, mixed> */
    public function payload(): array
    {
        $data = $this->validated();
        $data['measurements_cm'] = array_filter($data['measurements_cm'] ?? [], fn ($v) => $v !== null && $v !== '');

        return $data;
    }
}
