<?php

namespace App\Enums;

/** Faixa do plano pelo número de alunos ativos. Preços e limites em config/pricing.php. */
enum PlanTier: string
{
    case Essencial = 'essencial';
    case Academia = 'academia';
    case Ilimitado = 'ilimitado';
}
