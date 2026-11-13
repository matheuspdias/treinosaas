{{--
    Planos (valores em config/pricing.php, contas em App\Support\Pricing\Pricing).
    Mensal/Anual sem JavaScript: os rádios trocam o que aparece pelo CSS (.precos:has(...)).
    Preço de fundador só enquanto houver vaga real ($founderOpen); sem a contagem, só o preço cheio.
--}}
@php
    $incluso = [
        'Painel do dono e acesso para instrutores',
        'App do aluno com o nome, o logo e a cor da academia',
        'Treinos, modelos e avaliações ilimitados',
        'Mural de avisos e alunos sumidos',
    ];
@endphp
<section id="planos" aria-labelledby="planos-titulo" class="precos bg-ferro">
    <div class="wrap py-20 lg:py-28">
        <p class="kicker text-anilha" data-reveal>Planos</p>
        <h2 id="planos-titulo" class="display mt-5 max-w-4xl text-[clamp(3rem,12.5vw,6rem)]" data-reveal>
            Planos simples, sem taxa de implantação.
        </h2>
        <p class="mt-5 max-w-xl text-lg leading-snug text-cinza" data-reveal>
            O valor depende só do número de alunos ativos. O aluno não paga nada: quem assina é a academia.
        </p>

        @if ($founders !== null)
            @if ($founderOpen)
                <div class="mt-10 border-2 border-anilha p-5 sm:p-6" data-reveal>
                    <p class="font-cond text-xl font-bold uppercase sm:text-2xl">
                        <span aria-hidden="true">🔥</span> Programa Fundadores: restam {{ $founders['remaining'] }} de {{ $founders['total'] }} vagas
                    </p>
                    <div class="mt-3 h-3 bg-chumbo" role="progressbar" aria-label="Vagas de fundador preenchidas"
                         aria-valuemin="0" aria-valuemax="{{ $founders['total'] }}" aria-valuenow="{{ $founders['taken'] }}"
                         aria-valuetext="{{ $founders['taken'] }} de {{ $founders['total'] }} vagas preenchidas">
                        <div class="h-full bg-anilha" style="width: {{ $founders['total'] > 0 ? round($founders['taken'] / $founders['total'] * 100) : 0 }}%"></div>
                    </div>
                    <p class="mt-3 text-cinza">As {{ $founders['total'] }} primeiras academias garantem 45% de desconto para sempre.</p>
                </div>
            @else
                <div class="mt-10 border-2 border-chumbo p-5 sm:p-6" data-reveal>
                    <p class="font-cond text-xl font-bold uppercase sm:text-2xl">Vagas de fundador esgotadas</p>
                    <p class="mt-1 text-cinza">As {{ $founders['total'] }} vagas do Programa Fundadores já foram preenchidas.</p>
                </div>
            @endif
        @endif

        <fieldset class="ciclo mt-10 inline-flex border-2 border-chumbo p-1" data-reveal>
            <legend class="sr-only">Forma de pagamento</legend>
            <label class="ciclo-opcao">
                <input type="radio" name="ciclo" value="mensal" id="ciclo-mensal" class="sr-only" checked> Mensal
            </label>
            <label class="ciclo-opcao">
                <input type="radio" name="ciclo" value="anual" id="ciclo-anual" class="sr-only"> Anual
                <span class="ml-2 bg-anilha px-2 py-0.5 text-xs text-ferro">2 meses grátis</span>
            </label>
        </fieldset>

        <ul class="mt-8 grid gap-5 md:grid-cols-3">
            @foreach ($plans as $plan)
                <li @class([
                    'relative flex flex-col p-6 sm:p-7',
                    'bg-anilha text-ferro' => $plan['highlight'],
                    'border-2 border-chumbo' => ! $plan['highlight'],
                ]) data-reveal>
                    @if ($plan['highlight'])
                        <p class="absolute -top-3.5 left-6 bg-ferro px-3 py-1 font-cond text-sm font-bold tracking-wide text-anilha uppercase">{{ config('pricing.highlight_label') }}</p>
                    @endif
                    <h3 class="font-cond text-2xl font-bold uppercase">{{ $plan['name'] }}</h3>
                    <p @class(['mt-1', 'text-cinza' => ! $plan['highlight']])>{{ $plan['limit'] }}</p>

                    @foreach (['mensal' => [$plan['monthly'], $plan['founderMonthly']], 'anual' => [$plan['yearlyEquivalent'], $plan['founderYearlyEquivalent']]] as $ciclo => [$cheio, $fundador])
                        <div class="so-{{ $ciclo }} mt-6">
                            @if ($founderOpen)
                                <p @class(['text-lg', 'text-cinza' => ! $plan['highlight']])>
                                    <span class="sr-only">De</span><s>{{ $cheio }}/mês</s>
                                </p>
                                <p class="flex items-baseline gap-1">
                                    <span class="sr-only">por</span>
                                    <span class="display text-6xl">{{ $fundador }}</span>
                                    <span class="font-cond text-lg font-semibold">/mês</span>
                                </p>
                                <p @class(['mt-2 inline-block px-2 py-0.5 font-cond text-sm font-bold uppercase', 'bg-ferro text-anilha' => $plan['highlight'], 'bg-anilha text-ferro' => ! $plan['highlight']])>Preço de fundador</p>
                            @else
                                <p class="flex items-baseline gap-1">
                                    <span class="display text-6xl">{{ $cheio }}</span>
                                    <span class="font-cond text-lg font-semibold">/mês</span>
                                </p>
                            @endif
                            @if ($ciclo === 'anual')
                                <p @class(['mt-2 text-sm', 'text-cinza' => ! $plan['highlight']])>{{ $plan['yearlyTotal'] }} por ano: 12 meses pelo preço de 10.</p>
                            @endif
                        </div>
                    @endforeach

                    <a href="{{ $plan['whatsapp'] }}" target="_blank" rel="noopener"
                       class="btn {{ $plan['highlight'] ? 'btn-ferro' : 'btn-anilha' }} mt-8">
                        Agendar demonstração
                    </a>
                </li>
            @endforeach
        </ul>

        <p class="mt-8 font-cond text-lg font-semibold tracking-wide text-giz uppercase" data-reveal>
            Teste grátis de {{ config('pricing.trial_days') }} dias <span class="text-anilha" aria-hidden="true">•</span>
            Sem taxa de implantação <span class="text-anilha" aria-hidden="true">•</span>
            Sem fidelidade
        </p>
        <p class="mt-1 text-cinza" data-reveal>O teste começa na demonstração, com a gente configurando junto com você.</p>

        <div class="mt-14 grid gap-10 lg:grid-cols-2">
            <div data-reveal>
                <h3 class="font-cond text-xl font-bold uppercase">Incluído em todos os planos</h3>
                <ul class="mt-4 space-y-2 text-cinza">
                    @foreach ($incluso as $item)
                        <li class="flex gap-2"><span class="text-anilha" aria-hidden="true">—</span>{{ $item }}</li>
                    @endforeach
                </ul>
            </div>

            @if ($founderOpen)
                <div class="faq self-start" data-reveal>
                <details class="border-2 border-chumbo">
                    <summary class="flex min-h-16 cursor-pointer items-center justify-between gap-6 px-5 py-4 font-cond text-xl font-bold uppercase">
                        Como funciona o preço de fundador
                        <span class="mais display shrink-0 text-3xl leading-none" aria-hidden="true">+</span>
                    </summary>
                    <ul class="space-y-2 px-5 pb-5 text-cinza">
                        <li class="flex gap-2"><span class="text-anilha" aria-hidden="true">—</span>45% de desconto enquanto sua assinatura estiver ativa.</li>
                        <li class="flex gap-2"><span class="text-anilha" aria-hidden="true">—</span>Se sua academia crescer de faixa, o desconto acompanha.</li>
                        <li class="flex gap-2"><span class="text-anilha" aria-hidden="true">—</span>Reajuste anual apenas pela inflação.</li>
                        <li class="flex gap-2"><span class="text-anilha" aria-hidden="true">—</span>Em troca, pedimos seu feedback e um depoimento depois de 60 dias.</li>
                    </ul>
                </details>
                </div>
            @endif
        </div>
    </div>
</section>
