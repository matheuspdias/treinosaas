<?php

return [
    'ssr' => [
        'enabled' => false,
    ],

    'testing' => [
        // Os testes falham se a página referenciada no controller não existir.
        'ensure_pages_exist' => true,
        'page_paths' => [resource_path('js/pages')],
        'page_extensions' => ['tsx'],
    ],

    'history' => [
        'encrypt' => (bool) env('INERTIA_ENCRYPT_HISTORY', false),
    ],
];
