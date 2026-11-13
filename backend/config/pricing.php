<?php

/*
 * Planos e preços do TreinoBox: a ÚNICA fonte. Landing, painel de admin, API e cálculo da
 * assinatura leem daqui (pela classe App\Support\Pricing\Pricing). Nada de preço espalhado.
 */
return [
    // Faixas pelo número de alunos ativos. max_students null = sem limite. Preço cheio mensal em reais.
    'tiers' => [
        'essencial' => ['name' => 'Essencial', 'max_students' => 100, 'monthly' => 89],
        'academia' => ['name' => 'Academia', 'max_students' => 300, 'monthly' => 149],
        'ilimitado' => ['name' => 'Ilimitado', 'max_students' => null, 'monthly' => 229],
    ],

    // Plano em destaque na landing e o texto do selo. Sem clientes ainda, "Mais escolhido" seria
    // uma estatística inventada: troque o selo quando for verdade.
    'highlight' => 'academia',
    'highlight_label' => 'Recomendado',

    // Anual: paga 10 meses e leva 12 (vale também para o preço de fundador).
    'annual_months_paid' => 10,

    'trial_days' => 14,

    'founder' => [
        // Vagas do Programa Fundadores. As ocupadas são contadas no banco (academias com is_founder).
        'spots_total' => (int) env('FOUNDER_SPOTS_TOTAL', 10),
        // Desconto sobre o preço cheio vigente da faixa. O resultado é arredondado para o valor
        // terminado em 9 mais próximo (89 → 49, 149 → 79, 229 → 129).
        'discount' => 0.45,
        // Inadimplente (academia suspensa) por mais que isso perde o status de fundador.
        'grace_days' => 30,
    ],
];
