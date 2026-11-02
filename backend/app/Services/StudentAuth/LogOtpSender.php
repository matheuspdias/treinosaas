<?php

namespace App\Services\StudentAuth;

use App\Support\PhoneNumber;
use Illuminate\Support\Facades\Log;

/** Desenvolvimento: escreve o código no log, só com o telefone mascarado. */
class LogOtpSender implements OtpSender
{
    public function send(PhoneNumber $phone, string $code): void
    {
        Log::info('Código de verificação', ['phone' => $phone->masked(), 'code' => $code]);
    }
}
