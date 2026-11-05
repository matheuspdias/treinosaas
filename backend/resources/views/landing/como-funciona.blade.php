@php
    $passos = [
        [
            'titulo' => 'Cadastre o aluno',
            'texto' => 'Só nome e celular. O painel monta a mensagem com o link do app e você envia pelo WhatsApp.',
            'img' => 'painel-cadastro',
            'alt' => 'Painel no celular: cadastro de aluno com nome e celular',
        ],
        [
            'titulo' => 'Monte o treino',
            'texto' => 'Do zero ou a partir de um modelo: séries, repetições, carga, descanso e a observação do professor. Envie para um aluno ou para vários, com validade.',
            'img' => 'painel-treino',
            'alt' => 'Painel no celular: editor de treino com os exercícios da ficha A',
        ],
        [
            'titulo' => 'O aluno treina',
            'texto' => 'Ele entra com o celular e um PIN, segue a ficha e registra cada série. Você vê a frequência e a evolução no painel.',
            'img' => 'app-inicio',
            'alt' => 'App do aluno: próximo treino da academia e mural de avisos',
        ],
    ];
@endphp
<section id="como-funciona" aria-labelledby="como-titulo" class="bg-ferro">
    <div class="wrap py-20 lg:py-28">
        <p class="kicker text-anilha" data-reveal>Como funciona</p>
        <h2 id="como-titulo" class="display mt-5 max-w-4xl text-[clamp(3rem,12.5vw,6.25rem)]" data-reveal>
            Três passos. Nenhuma folha.
        </h2>

        <ol class="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-3 lg:gap-10">
            @foreach ($passos as $i => $p)
                {{-- Celular: abaixo do texto; no tablet, ao lado dele; no computador, degraus (cada passo um pouco mais abaixo). --}}
                <li @class(['grid grid-cols-[auto_1fr] gap-x-5 sm:grid-cols-[auto_1fr_minmax(0,14rem)] sm:items-center sm:gap-x-8 lg:block', 'lg:mt-16' => $i === 1, 'lg:mt-32' => $i === 2]) data-reveal>
                    <span class="num-vazado display row-span-2 text-[6.5rem] leading-[0.8] [--num:var(--color-anilha)] lg:text-[9rem]" aria-hidden="true">{{ $i + 1 }}</span>
                    <h3 class="display self-end text-3xl lg:mt-5 lg:text-4xl"><span class="sr-only">Passo {{ $i + 1 }}: </span>{{ $p['titulo'] }}</h3>
                    <p class="mt-2 self-start text-lg leading-snug text-cinza">{{ $p['texto'] }}</p>
                    <x-landing.phone :name="$p['img']" :alt="$p['alt']" sizes="(min-width: 1024px) 240px, (min-width: 640px) 224px, 60vw"
                        class="col-span-2 mt-8 w-[62%] max-w-[15rem] sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:w-full lg:mt-8 lg:w-[72%]" />
                </li>
            @endforeach
        </ol>
    </div>
</section>
