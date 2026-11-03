<section id="topo" aria-labelledby="hero-titulo" class="overflow-hidden">
    <div class="wrap grid items-center gap-y-8 pt-2 pb-16 lg:grid-cols-12 lg:gap-x-10 lg:pt-10 lg:pb-28">
        <div class="lg:col-span-7">
            <p class="kicker text-anilha">Ficha de treino digital para academias</p>
            {{-- O risco amarelo é decorativo: leitores de tela leem "Chega de ficha de papel." --}}
            <h1 id="hero-titulo" class="display mt-5 text-[clamp(3.5rem,18vw,8.75rem)]">
                Chega de<br>
                ficha de<br>
                <span class="relative inline-block">papel<span class="risco" aria-hidden="true"></span></span>.
            </h1>
            <p class="mt-4 max-w-xl text-lg leading-snug text-cinza sm:mt-5 sm:text-xl">
                Você monta o treino no painel. O aluno abre no celular, vê a demonstração de cada exercício e registra as cargas. A evolução fica salva.
            </p>
            <div class="mt-6 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
                <a href="{{ $whatsapp('contato') }}" target="_blank" rel="noopener" class="btn btn-anilha">
                    <x-landing.whatsapp-icon /> Falar no WhatsApp
                </a>
                <a href="{{ $whatsapp('demonstracao') }}" target="_blank" rel="noopener" class="btn btn-linha hidden text-giz sm:inline-flex">
                    Agendar demonstração
                </a>
                {{-- No celular vira link de texto: o título, o botão principal e o celular cabem na primeira tela. --}}
                <a href="{{ $whatsapp('demonstracao') }}" target="_blank" rel="noopener" class="min-h-11 content-center self-start font-cond text-lg font-semibold tracking-wide text-giz uppercase underline decoration-anilha decoration-2 underline-offset-4 sm:hidden">
                    ou agende uma demonstração
                </a>
            </div>
        </div>

        {{-- Ficha de papel (HTML) atrás do celular com o print real do modo treino. --}}
        <div class="relative mx-auto w-full max-w-[22rem] lg:col-span-5 lg:max-w-none">
            <div class="paper absolute top-10 -left-4 w-[62%] -rotate-[7deg] px-5 pt-12 pb-10 font-cond sm:-left-10 lg:top-16 lg:-left-16" aria-hidden="true">
                <p class="text-[0.7rem] font-bold tracking-widest uppercase opacity-60">Ficha de treino</p>
                <p class="mt-1 text-lg leading-none font-bold">Treino B</p>
                <ul class="mt-4 space-y-[0.55rem] text-[0.95rem] leading-[1.35rem]">
                    <li class="flex justify-between gap-2"><span>Puxada frontal</span><span>4x10 <span class="rabisco">40</span> 45</span></li>
                    <li class="flex justify-between gap-2"><span>Remada baixa</span><span>3x10 ??</span></li>
                    <li class="flex justify-between gap-2"><span>Rosca direta</span><span><span class="rabisco">3x12 15</span> 3x10 17,5</span></li>
                </ul>
            </div>
            <x-landing.phone name="app-treino" eager sizes="(min-width: 1024px) 320px, 62vw"
                alt="App do aluno no modo treino: puxada frontal com as séries, a carga e o cronômetro de descanso"
                class="relative ml-auto w-[64%] rotate-[3deg] sm:w-[60%] lg:w-[74%]" />
        </div>
    </div>
</section>
