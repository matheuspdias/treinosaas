@php
    $recursos = [
        ['Treino do dia', 'O app mostra o próximo treino da sequência (A, B, C) assim que o aluno abre.'],
        ['Demonstração animada do movimento', 'Mais de 870 exercícios, cada um com a animação da execução.'],
        ['Carga em segundos', 'Um toque por série. O descanso entre as séries é cronometrado sozinho.'],
        ['Sugestão de progressão', 'Bateu as repetições? O app sugere subir a carga na próxima vez.'],
        ['Histórico e recordes', 'Gráfico de carga por exercício e os recordes pessoais.'],
        ['Treinos próprios', 'Além da ficha da academia, que ele não consegue alterar, o aluno pode montar as dele.'],
        ['Sem internet', 'O treino fica salvo no aparelho e vai para o painel quando a conexão volta.'],
    ];
@endphp
<section id="aluno" aria-labelledby="aluno-titulo" class="overflow-hidden bg-ferro">
    <div class="wrap py-20 lg:py-28">
        <div class="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
            {{-- Três celulares em escada. --}}
            <div class="order-2 lg:order-1 lg:col-span-7">
                <div class="relative mx-auto grid max-w-2xl grid-cols-3 items-start gap-3 sm:gap-5 lg:max-w-none lg:gap-6">
                    <x-landing.phone name="app-exercicio" sizes="(min-width: 1024px) 240px, 31vw"
                        alt="Detalhe do exercício com a demonstração animada do movimento" data-reveal />
                    <x-landing.phone name="app-fichas" sizes="(min-width: 1024px) 220px, 31vw"
                        alt="Fichas do aluno: o treino da academia em destaque, só para leitura" class="mt-8 sm:mt-16" data-reveal />
                    <x-landing.phone name="app-historico" sizes="(min-width: 1024px) 220px, 31vw"
                        alt="Histórico do exercício com gráfico de evolução da carga" class="mt-16 sm:mt-32" data-reveal />
                </div>
            </div>
            <div class="order-1 lg:order-2 lg:col-span-5">
                <p class="kicker text-anilha" data-reveal>Para o aluno</p>
                <h2 id="aluno-titulo" class="display mt-5 text-[clamp(3rem,12.5vw,6rem)]" data-reveal>
                    O treino no bolso. A carga anotada.
                </h2>
                {{-- No tablet a lista vira duas colunas, para não sobrar espaço vazio à direita. --}}
                <ul class="mt-8 border-t border-chumbo sm:grid sm:grid-cols-2 sm:gap-x-8 lg:block">
                    @foreach ($recursos as [$titulo, $texto])
                        <li class="border-b border-chumbo py-4" data-reveal>
                            <p class="font-cond text-xl font-bold uppercase">{{ $titulo }}</p>
                            <p class="mt-1 leading-snug text-cinza">{{ $texto }}</p>
                        </li>
                    @endforeach
                </ul>
            </div>
        </div>
    </div>
</section>
