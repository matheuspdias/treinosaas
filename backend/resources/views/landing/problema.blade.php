@php
    $linhas = [
        ['Se perde, rasga, fica esquecida no armário.', 'Fica no celular do aluno e funciona até sem internet.'],
        ['Fica desatualizada: o professor muda e ninguém passa a limpo.', 'Você altera no painel e o aluno recebe o treino novo, com aviso.'],
        ['Não mostra evolução. A carga do mês passado sumiu.', 'Cada série fica registrada, com gráfico de carga por exercício.'],
        ['Uma ficha por aluno, escrita à mão.', 'Monte um modelo uma vez e envie para vários alunos de uma vez.'],
    ];
@endphp
<section aria-labelledby="problema-titulo" class="bg-giz text-ferro">
    <div class="wrap py-20 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-12 lg:items-end">
            <h2 id="problema-titulo" class="display text-[clamp(3rem,12.5vw,6.25rem)] lg:col-span-7" data-reveal>
                A ficha de papel não aguenta o treino.
            </h2>
            <p class="max-w-md text-lg leading-snug text-grafite lg:col-span-5 lg:pb-3" data-reveal>
                Ela funcionava quando era o que existia. Hoje todo aluno treina com o celular no bolso: o treino pode estar nele.
            </p>
        </div>

        {{-- Tabela antes × depois. No celular cada linha vira um bloco. --}}
        <div class="mt-14 border-t-4 border-ferro">
            <div class="hidden grid-cols-12 gap-6 border-b border-ferro/20 py-3 font-cond text-sm font-bold tracking-[0.18em] uppercase md:grid" aria-hidden="true">
                <span class="col-span-2"></span>
                <span class="col-span-5 text-grafite">No papel</span>
                <span class="col-span-5">No {{ $app }}</span>
            </div>
            <ol>
                @foreach ($linhas as $i => [$antes, $depois])
                    <li class="grid gap-3 border-b border-ferro/20 py-7 md:grid-cols-12 md:gap-6 md:py-9" data-reveal>
                        <span class="num-vazado display text-6xl md:col-span-2 md:text-7xl" aria-hidden="true">{{ sprintf('%02d', $i + 1) }}</span>
                        <p class="text-lg text-grafite md:col-span-5 md:text-xl">
                            <span class="sr-only">No papel: </span><s class="decoration-ferro/40 decoration-2">{{ $antes }}</s>
                        </p>
                        <p class="text-xl leading-snug font-bold md:col-span-5 md:text-2xl">
                            <span class="sr-only">No {{ $app }}: </span>{{ $depois }}
                        </p>
                    </li>
                @endforeach
            </ol>
        </div>
    </div>
</section>
