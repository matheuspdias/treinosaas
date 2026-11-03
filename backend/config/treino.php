<?php

return [
    'student' => [
        // Janela para o aluno criar o PIN depois do cadastro (ou de "liberar primeiro acesso").
        'first_access_hours' => (int) env('STUDENT_FIRST_ACCESS_HOURS', 48),
        // Sessão no celular: renovada a cada uso, expira depois desse tempo parado.
        'token_days' => (int) env('STUDENT_TOKEN_DAYS', 180),
        'max_pin_attempts' => 5,
        'lock_minutes' => 15,
        // Segundo fator: 'pin' hoje. 'otp' (WhatsApp/SMS) entra implementando App\Services\StudentAuth\OtpSender.
        'second_factor' => env('STUDENT_SECOND_FACTOR', 'pin'),
    ],

    // App do aluno (PWA). Cada academia tem o seu em {pwa_url}/{slug}, com nome, cor e ícone próprios.
    'pwa_url' => rtrim((string) env('PWA_URL', 'http://localhost:5174'), '/'),

    // Primeiro segmento de URL que a PWA usa para arquivos: nenhuma academia pode ter esse slug.
    'reserved_slugs' => ['assets', 'exercises', 'splash', 'screenshots', 'api', 'sw', 'workbox', 'manifest', 'importar', 'academia'],
];
