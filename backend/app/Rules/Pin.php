<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** PIN de 4 a 6 dígitos, recusando os óbvios (1111, 1234, 4321). */
class Pin implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\d{4,6}$/', $value)) {
            $fail('O PIN deve ter de 4 a 6 números.');

            return;
        }

        if (self::isWeak($value)) {
            $fail('Esse PIN é fácil de adivinhar. Evite números repetidos ou em sequência.');
        }
    }

    public static function isWeak(string $pin): bool
    {
        if (count(array_unique(str_split($pin))) === 1) {
            return true;
        }

        return str_contains('0123456789', $pin) || str_contains('9876543210', $pin);
    }
}
