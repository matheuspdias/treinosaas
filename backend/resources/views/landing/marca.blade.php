{{-- "Sua marca" e "para o negócio" juntos: a imagem profissional vem justamente do app ter a cara da academia. --}}
@php
    $ganhos = [
        ['Cara de academia organizada.', 'O aluno instala um app com o nome, o logo e a cor da sua academia. Nada de folha dobrada no bolso.'],
        ['Aluno que vê a própria evolução.', 'Ele acompanha a carga subindo, bate recordes e recebe o aviso quando o treino muda.'],
        ['Professor com mais tempo no salão.', 'Menos ficha para passar a limpo, mais tempo corrigindo execução.'],
    ];
@endphp
<section id="marca" aria-labelledby="marca-titulo" class="bg-anilha text-ferro">
    <div class="fita" aria-hidden="true"></div>
    <div class="wrap py-20 lg:py-28">
        <div class="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div class="lg:col-span-7">
                <p class="kicker" data-reveal>Sua marca</p>
                <h2 id="marca-titulo" class="display mt-5 text-[clamp(3rem,12.5vw,7rem)]" data-reveal>
                    O app com a cara da sua academia.
                </h2>
                <p class="mt-5 max-w-xl text-lg leading-snug font-medium" data-reveal>
                    No painel você escolhe o nome, o logo e a cor. Cada academia ganha o próprio link: o aluno abre, instala e o ícone fica na tela do celular dele, ao lado do banco e do WhatsApp.
                </p>
            </div>
            {{-- O ícone na tela inicial e o app aberto com a marca da academia. --}}
            <div class="flex items-start justify-center gap-4 sm:gap-8 lg:col-span-5" data-reveal>
                <x-landing.home-screen class="w-[47%] max-w-[15rem] rotate-[-3deg]" />
                <x-landing.phone name="app-entrar" sizes="(min-width: 1024px) 240px, 47vw"
                    alt="App aberto: a tela de entrada com o logo e o nome da academia"
                    class="mt-10 w-[47%] max-w-[15rem] rotate-[3deg] sm:mt-16" />
            </div>
        </div>
    </div>

    {{-- Para o negócio: foto real de academia + três ganhos em letra grande. --}}
    <div class="grid lg:grid-cols-2">
        <img src="{{ asset('landing/img/levantamento-1024.webp') }}"
             srcset="{{ asset('landing/img/levantamento-640.webp') }} 640w, {{ asset('landing/img/levantamento-1024.webp') }} 1024w, {{ asset('landing/img/levantamento-1600.webp') }} 1600w"
             sizes="(min-width: 1024px) 50vw, 100vw" width="1600" height="1067" loading="lazy" decoding="async"
             alt="Aluno levantando uma barra acima da cabeça numa academia, com outros alunos treinando ao fundo"
             class="h-full max-h-[34rem] w-full object-cover lg:max-h-none">
        <div class="bg-ferro px-4 py-16 text-giz sm:px-6 lg:px-14 lg:py-20">
            <p class="kicker text-anilha">Para o negócio</p>
            <ul class="mt-6 space-y-10">
                @foreach ($ganhos as [$titulo, $texto])
                    <li data-reveal>
                        <p class="display text-4xl leading-[1.04] sm:text-5xl">{{ $titulo }}</p>
                        <p class="mt-2 max-w-md text-lg leading-snug text-cinza">{{ $texto }}</p>
                    </li>
                @endforeach
            </ul>
        </div>
    </div>
</section>
