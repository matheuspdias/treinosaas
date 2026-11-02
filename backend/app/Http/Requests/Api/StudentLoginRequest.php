<?php

namespace App\Http\Requests\Api;

use App\Rules\Pin;
use Illuminate\Foundation\Http\FormRequest;

class StudentLoginRequest extends FormRequest
{
    public function rules(): array
    {
        $creating = $this->routeIs('api.student.first-access');

        return [
            'phone' => ['required', 'string', 'max:30'],
            'academyId' => ['nullable', 'uuid'],
            // No login não reclamamos de PIN "fraco": ele já existe.
            'pin' => $creating ? ['required', 'string', new Pin] : ['required', 'string', 'regex:/^\d{4,6}$/'],
            'device' => ['nullable', 'string', 'max:100'],
            'acceptPrivacy' => $creating ? ['accepted'] : ['sometimes'],
        ];
    }

    public function messages(): array
    {
        return [
            'pin.regex' => 'O PIN tem de 4 a 6 números.',
            'acceptPrivacy.accepted' => 'Para continuar, aceite o aviso de privacidade.',
        ];
    }

    public function device(): string
    {
        return $this->validated('device') ?: 'Celular';
    }
}
