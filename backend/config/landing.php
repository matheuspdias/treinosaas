<?php

/*
 * Landing page de venda (rota "/" para visitantes). Tudo o que muda com frequência fica aqui.
 */
return [
    // Nome do produto em toda a landing (título, textos, mensagens do WhatsApp).
    'app_name' => env('LANDING_APP_NAME', 'TreinoBox'),

    'whatsapp' => [
        // Só dígitos, com DDI e DDD: 5511912345678. Vazio: o WhatsApp abre para escolher o contato.
        'number' => preg_replace('/\D/', '', (string) env('LANDING_WHATSAPP', '')),
        // :app vira o nome do produto.
        'messages' => [
            'contato' => 'Olá! Tenho uma academia e quero conhecer o :app.',
            'demonstracao' => 'Olá! Quero agendar uma demonstração do :app para a minha academia.',
            'plano' => 'Olá! Quero saber mais sobre o plano :plan do :app.',
            'preco' => 'Olá! Quero saber quanto custa o :app para a minha academia.',
        ],
    ],

    // E-mail de contato no rodapé e na política de privacidade.
    'contact_email' => env('LANDING_CONTACT_EMAIL', 'contato@treinobox.com.br'),

    // Política de privacidade (/privacidade). Responsável: quem responde pelos dados (pessoa ou empresa).
    'privacy' => [
        'responsible' => env('LANDING_PRIVACY_RESPONSIBLE', 'Equipe TreinoBox'),
        // Mude a data sempre que mudar o texto da política.
        'updated_at' => '2026-11-04',
    ],

    // Resposta do "Quanto custa?" no FAQ (vem seguida do botão do WhatsApp).
    'pricing_answer' => 'Os planos variam conforme o número de alunos da academia. Chame no WhatsApp e a gente passa o valor para a sua.',

    // Seção de planos: desligada até os preços estarem definidos. Desligada, some também do menu e dos CTAs.
    'show_pricing' => (bool) env('LANDING_SHOW_PRICING', false),

    // PLACEHOLDER: valores, limites e itens a definir. "R$ XX" fica visível de propósito.
    'plans' => [
        [
            'name' => 'Plano 1',
            'price' => 'R$ XX',
            'period' => '/mês',
            'limit' => 'Até XX alunos',
            'highlight' => false,
            'features' => ['Painel do dono', 'App do aluno com a marca da academia', 'Treinos e modelos ilimitados'],
        ],
        [
            'name' => 'Plano 2',
            'price' => 'R$ XX',
            'period' => '/mês',
            'limit' => 'Até XX alunos',
            'highlight' => true,
            'features' => ['Tudo do Plano 1', 'Acesso para instrutores', 'Avaliação física e mural de avisos'],
        ],
        [
            'name' => 'Plano 3',
            'price' => 'R$ XX',
            'period' => '/mês',
            'limit' => 'Alunos ilimitados',
            'highlight' => false,
            'features' => ['Tudo do Plano 2', 'XX', 'XX'],
        ],
    ],
];
