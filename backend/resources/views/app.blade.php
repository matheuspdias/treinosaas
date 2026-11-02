<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="robots" content="noindex">
        <meta name="theme-color" content="#f4f5f7" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0b0d10" media="(prefers-color-scheme: dark)">
        {{-- Tema antes do primeiro paint (sem piscar). Mesma chave de resources/js/ui/theme/theme.ts. --}}
        <script>
            (function () {
                var pref = null;
                try { pref = localStorage.getItem('treinosaas.theme'); } catch (e) {}
                var dark = pref === 'dark' || (pref !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.dataset.theme = dark ? 'dark' : 'light';
            })();
        </script>
        <title inertia>{{ config('app.name') }}</title>
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
