{{-- Só aparece com landing.show_pricing = true. Valores e limites em config/landing.php (placeholders "R$ XX"). --}}
<section id="planos" aria-labelledby="planos-titulo" class="bg-ferro">
    <div class="wrap py-20 lg:py-28">
        <p class="kicker text-anilha" data-reveal>Planos</p>
        <h2 id="planos-titulo" class="display mt-5 text-[clamp(3rem,12.5vw,6rem)]" data-reveal>Quanto custa.</h2>
        <p class="mt-4 max-w-xl text-lg text-cinza" data-reveal>O aluno não paga nada. Quem assina é a academia.</p>

        <ul class="mt-12 grid gap-5 md:grid-cols-3">
            @foreach ($plans as $plan)
                <li @class([
                    'flex flex-col p-7',
                    'bg-anilha text-ferro' => $plan['highlight'],
                    'border-2 border-chumbo' => ! $plan['highlight'],
                ]) data-reveal>
                    <h3 class="font-cond text-2xl font-bold uppercase">{{ $plan['name'] }}</h3>
                    <p class="mt-1 {{ $plan['highlight'] ? '' : 'text-cinza' }}">{{ $plan['limit'] }}</p>
                    <p class="mt-6 flex items-baseline gap-1">
                        <span class="display text-6xl">{{ $plan['price'] }}</span>
                        <span class="font-cond text-lg font-semibold">{{ $plan['period'] }}</span>
                    </p>
                    <ul class="mt-6 flex-1 space-y-2">
                        @foreach ($plan['features'] as $feature)
                            <li class="flex gap-2"><span aria-hidden="true">—</span>{{ $feature }}</li>
                        @endforeach
                    </ul>
                    <a href="{{ $whatsapp('plano', ['plan' => $plan['name']]) }}" target="_blank" rel="noopener"
                       class="btn {{ $plan['highlight'] ? 'btn-ferro' : 'btn-anilha' }} mt-8">
                        Quero o {{ $plan['name'] }}
                    </a>
                </li>
            @endforeach
        </ul>
    </div>
</section>
