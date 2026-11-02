<?php

namespace App\Http\Requests\Panel;

use App\Rules\BrazilianMobile;
use Illuminate\Foundation\Http\FormRequest;

class StudentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', new BrazilianMobile],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'nome', 'phone' => 'celular'];
    }
}
