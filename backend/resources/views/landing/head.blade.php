{{-- Ícones, fontes e CSS/JS da landing; usado também pela política de privacidade. --}}
<link rel="icon" href="{{ asset('landing/favicon.svg') }}" type="image/svg+xml">
<link rel="icon" href="{{ asset('landing/favicon-32.png') }}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{{ asset('landing/apple-touch-icon.png') }}">

<link rel="preload" href="/fonts/landing/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/landing/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
@vite(['resources/css/landing.css', 'resources/js/landing.js'])
