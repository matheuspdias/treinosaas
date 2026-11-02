<?php

namespace App\Services\StudentAuth;

use App\Models\Student;

/**
 * Segundo fator do login do aluno (o primeiro é o telefone).
 * Hoje: PinSecondFactor. Futuro: código enviado por WhatsApp/SMS (ver OtpSender).
 */
interface SecondFactor
{
    public function verify(Student $student, string $secret): bool;
}
