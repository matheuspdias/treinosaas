<?php

namespace App\Services\StudentAuth;

use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class PinSecondFactor implements SecondFactor
{
    public function verify(Student $student, string $secret): bool
    {
        return $student->pin_hash !== null && Hash::check($secret, $student->pin_hash);
    }
}
