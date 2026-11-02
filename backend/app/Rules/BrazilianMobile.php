<?php

namespace App\Rules;

use App\Support\PhoneNumber;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class BrazilianMobile implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || PhoneNumber::tryParse($value) === null) {
            $fail('Informe um celular válido com DDD, por exemplo (11) 91234-5678.');
        }
    }
}
