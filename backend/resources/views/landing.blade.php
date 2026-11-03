@php
    $title = "{$app}: ficha de treino no celular para a sua academia";
    $description = 'Troque a ficha de papel por um app com a marca da sua academia. Você monta e envia os treinos pelo painel; o aluno treina pelo celular, registra as cargas e acompanha a evolução.';
    $nav = array_filter([
        ['#como-funciona', 'Como funciona'],
        ['#dono', 'Para o dono'],
        ['#aluno', 'Para o aluno'],
        $showPricing ? ['#planos', 'Planos'] : null,
        ['#faq', 'Dúvidas'],
    ]);
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">
    <link rel="canonical" href="{{ url('/') }}">
    <meta name="theme-color" content="#121212">

    {{-- Prévia do link (WhatsApp, redes sociais). --}}
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="{{ $app }}">
    <meta property="og:title" content="Sua academia sem ficha de papel | {{ $app }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ asset('landing/og.jpg') }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Celular com o treino do aluno e o título: sua academia sem ficha de papel">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" href="{{ asset('landing/favicon.svg') }}" type="image/svg+xml">
    <link rel="icon" href="{{ asset('landing/favicon-32.png') }}" sizes="32x32" type="image/png">
    <link rel="apple-touch-icon" href="{{ asset('landing/apple-touch-icon.png') }}">

    <link rel="preload" href="/fonts/landing/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/landing/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
    @vite(['resources/css/landing.css', 'resources/js/landing.js'])
</head>
<body class="bg-ferro text-giz">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-anilha focus:px-4 focus:py-3 focus:font-bold focus:text-ferro">Pular para o conteúdo</a>

    <header class="wrap flex items-center justify-between gap-4 py-4 lg:py-6">
        <a href="{{ url('/') }}" class="display text-3xl text-giz" aria-label="{{ $app }}, início">{{ $app }}<span class="text-anilha" aria-hidden="true">.</span></a>
        <nav aria-label="Seções" class="hidden lg:block">
            <ul class="flex items-center gap-7 font-cond text-base font-semibold tracking-wide uppercase">
                @foreach ($nav as [$href, $label])
                    <li><a href="{{ $href }}" class="text-cinza transition-colors hover:text-giz">{{ $label }}</a></li>
                @endforeach
            </ul>
        </nav>
        <div class="flex items-center gap-2 sm:gap-4">
            <a href="{{ route('login') }}" class="min-h-11 content-center px-2 font-cond text-base font-semibold tracking-wide text-cinza uppercase hover:text-giz">Entrar</a>
            <a href="{{ $whatsapp('contato') }}" target="_blank" rel="noopener" class="btn btn-anilha hidden min-h-11 px-4 text-base sm:inline-flex">
                <x-landing.whatsapp-icon class="size-5" /> Falar no WhatsApp
            </a>
        </div>
    </header>

    <main id="conteudo">
        @include('landing.hero')
        @include('landing.problema')
        @include('landing.como-funciona')
        @include('landing.dono')
        @include('landing.aluno')
        @include('landing.marca')

        {{--
            PROVA SOCIAL (placeholder): entra aqui quando houver dados reais.
            Ex.: depoimento de um dono de academia (nome, academia, cidade, foto autorizada) ou
            "X academias usam o {{ $app }}". Não usar números ou logos que não sejam verdadeiros.
        --}}

        @if ($showPricing)
            @include('landing.planos')
        @endif
        @include('landing.faq')
        @include('landing.contato')
    </main>

    <a href="{{ $whatsapp('contato') }}" target="_blank" rel="noopener" data-wa-float data-hidden inert
       class="wa-float btn btn-anilha size-14 rounded-full p-0 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)] sm:size-auto sm:rounded-none sm:px-5"
       aria-label="Falar no WhatsApp">
        <x-landing.whatsapp-icon class="size-7 sm:size-5" />
        <span class="hidden sm:inline" aria-hidden="true">WhatsApp</span>
    </a>
</body>
</html>
