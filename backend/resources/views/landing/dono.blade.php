@php
    $recursos = [
        ['Alunos', 'Cadastro por nome e celular, busca e opção de inativar sem apagar o histórico.'],
        ['Treinos e modelos', 'Fichas A, B, C com exercícios do catálogo. Salve como modelo e reaproveite.'],
        ['Envio com validade', 'Mande o mesmo treino para vários alunos. O painel mostra as fichas que estão vencendo.'],
        ['Evolução e frequência', 'Carga por exercício em gráfico, treinos por semana e os últimos treinos de cada aluno.'],
        ['Alunos sumidos', 'Quem não treina há 7, 14 ou 30 dias aparece numa lista, para você chamar de volta.'],
        ['Avaliação e avisos', 'Registre peso e medidas, e publique avisos que aparecem no app do aluno.'],
        ['Equipe', 'O instrutor cria treinos e avaliações. Cadastro de alunos e avisos ficam com você.'],
        ['No celular ou no computador', 'O painel funciona nos dois. Sem instalar nada.'],
    ];
@endphp
<section id="dono" aria-labelledby="dono-titulo" class="overflow-hidden bg-giz text-ferro">
    <div class="wrap py-20 lg:py-28">
        <div class="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div class="lg:col-span-5">
                <p class="kicker text-grafite" data-reveal>Para o dono</p>
                <h2 id="dono-titulo" class="display mt-5 text-[clamp(3rem,12.5vw,6rem)]" data-reveal>
                    O painel da sua academia.
                </h2>
                <p class="mt-5 max-w-md text-lg leading-snug text-grafite" data-reveal>
                    Tudo o que estava na pasta de fichas, organizado por aluno. Abra no início do dia e veja quem treinou, quem sumiu e qual treino está vencendo.
                </p>
            </div>
            {{-- O notebook passa da margem direita no computador. --}}
            <figure class="lg:col-span-7 lg:-mr-24 xl:-mr-40" data-reveal>
                <div class="laptop">
                    <img src="{{ asset('landing/img/painel-inicio-1280.webp') }}"
                         srcset="{{ asset('landing/img/painel-inicio-640.webp') }} 640w, {{ asset('landing/img/painel-inicio-1280.webp') }} 1280w"
                         sizes="(min-width: 1024px) 760px, 100vw" width="1280" height="800" loading="lazy" decoding="async"
                         alt="Painel do dono no computador: alunos ativos, treinos na semana, fichas vencendo e alunos sumidos">
                </div>
                <div class="laptop-base" aria-hidden="true"></div>
            </figure>
        </div>

        <dl class="mt-16 grid gap-x-10 border-t-4 border-ferro sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            @foreach ($recursos as $i => [$titulo, $texto])
                <div class="border-b border-ferro/20 py-6 lg:py-8" data-reveal>
                    <dt class="flex items-baseline gap-3 font-cond text-xl font-bold uppercase">
                        <span class="text-sm text-grafite tabular-nums" aria-hidden="true">{{ sprintf('%02d', $i + 1) }}</span>{{ $titulo }}
                    </dt>
                    <dd class="mt-2 text-base leading-snug text-grafite">{{ $texto }}</dd>
                </div>
            @endforeach
        </dl>
    </div>
</section>
