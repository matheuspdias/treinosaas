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
            'plano' => 'Oi! Vim pelo site do :app e quero agendar uma demonstração do plano :plan.',
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

    // Resposta do "Quanto custa?" no FAQ quando a seção de planos está desligada (vem com o botão do WhatsApp).
    'pricing_answer' => 'Os planos variam conforme o número de alunos da academia. Chame no WhatsApp e a gente passa o valor para a sua.',

    // Seção de planos (preços em config/pricing.php). Desligada, some também do menu e dos CTAs.
    'show_pricing' => (bool) env('LANDING_SHOW_PRICING', true),
];
