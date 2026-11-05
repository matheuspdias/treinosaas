{{-- Rodapé da landing e da política de privacidade. $fotos: créditos das fotos (só na landing). --}}
@php($email = config('landing.contact_email'))
<footer class="wrap flex flex-col gap-4 border-t border-chumbo py-8 text-sm text-cinza sm:flex-row sm:items-start sm:justify-between">
    <p><span class="display text-lg text-giz">{{ $app }}<span class="text-anilha">.</span></span> © {{ date('Y') }}</p>
    <ul class="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
        @if ($email)
            <li><a href="mailto:{{ $email }}" class="underline underline-offset-4 hover:text-giz">{{ $email }}</a></li>
        @endif
        <li><a href="{{ route('privacy') }}" class="underline-offset-4 hover:text-giz hover:underline">Política de privacidade</a></li>
        <li><a href="{{ route('login') }}" class="underline-offset-4 hover:text-giz hover:underline">Já é cliente? Entrar no painel</a></li>
        @if ($fotos ?? false)
            <li>Fotos: <a href="https://www.pexels.com/@victorfreitas/" class="underline underline-offset-4 hover:text-giz" rel="noopener">Victor Freitas</a> e <a href="https://www.pexels.com/@jonathanborba/" class="underline underline-offset-4 hover:text-giz" rel="noopener">Jonathan Borba</a> (Pexels)</li>
        @endif
    </ul>
</footer>
