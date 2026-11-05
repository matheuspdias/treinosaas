<section id="contato" aria-labelledby="contato-titulo" class="relative isolate overflow-hidden bg-ferro">
    <img src="{{ asset('landing/img/barra-no-chao-800.webp') }}"
         srcset="{{ asset('landing/img/barra-no-chao-480.webp') }} 480w, {{ asset('landing/img/barra-no-chao-800.webp') }} 800w, {{ asset('landing/img/barra-no-chao-1200.webp') }} 1200w"
         sizes="(min-width: 1024px) 45vw, 100vw" width="1200" height="1799" loading="lazy" decoding="async" alt=""
         class="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-35 lg:w-[45%] lg:opacity-60">
    <div class="absolute inset-0 -z-10 bg-gradient-to-r from-ferro via-ferro/90 to-ferro/40 lg:via-ferro" aria-hidden="true"></div>

    <div class="wrap py-24 lg:py-36">
        <h2 id="contato-titulo" class="display max-w-4xl text-[clamp(3.25rem,13vw,9rem)]" data-reveal>
            Bora tirar a ficha do papel?
        </h2>
        <p class="mt-6 max-w-lg text-xl leading-snug text-cinza" data-reveal>
            Chame no WhatsApp. A gente mostra o painel e o app funcionando com os treinos da sua academia.
        </p>
        <div class="mt-9 flex flex-col gap-3 sm:flex-row" data-reveal>
            <a href="{{ $whatsapp('contato') }}" target="_blank" rel="noopener" class="btn btn-anilha">
                <x-landing.whatsapp-icon /> Falar no WhatsApp
            </a>
            <a href="{{ $whatsapp('demonstracao') }}" target="_blank" rel="noopener" class="btn btn-linha text-giz">
                Agendar demonstração
            </a>
        </div>
    </div>

    @include('landing.rodape', ['fotos' => true])
</section>
