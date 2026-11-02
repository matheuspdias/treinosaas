<?php

namespace App\Services\StudentAuth;

use App\Support\PhoneNumber;

/**
 * Envio de código de verificação (opção futura, no lugar da janela de primeiro acesso).
 *
 * Recomendado: WhatsApp Cloud API (Meta) com template de categoria "authentication".
 * Implementação: WhatsAppCloudOtpSender chamando POST /{phone-number-id}/messages; trocar o
 * binding no AppServiceProvider e STUDENT_SECOND_FACTOR=otp.
 */
interface OtpSender
{
    public function send(PhoneNumber $phone, string $code): void;
}
