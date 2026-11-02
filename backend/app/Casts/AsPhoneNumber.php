<?php

namespace App\Casts;

use App\Support\PhoneNumber;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/** @implements CastsAttributes<PhoneNumber, PhoneNumber|string> */
class AsPhoneNumber implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?PhoneNumber
    {
        return $value === null ? null : PhoneNumber::parse($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return ($value instanceof PhoneNumber ? $value : PhoneNumber::parse($value))->e164();
    }
}
