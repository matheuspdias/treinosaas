@php
    // A resposta do preço vem da config e ganha o botão do WhatsApp logo abaixo.
    $perguntas = [
        ['Quanto custa?', config('landing.pricing_answer'), 'preco'],
        [
            'O aluno precisa instalar alguma coisa?',
            'Não precisa baixar de loja. O aluno abre o link da academia no celular e o app mostra como colocá-lo na tela de início, com o nome e o logo da academia. Durante o treino funciona até sem internet.',
        ],
        [
            'Funciona em iPhone e Android?',
            'Sim. No Android, o Chrome oferece "Instalar app". No iPhone, é pelo Safari: Compartilhar → Adicionar à Tela de Início.',
        ],
        [
            'O aluno paga alguma coisa?',
            'Não. Quem assina é a academia. Para o aluno o app é gratuito.',
        ],
        [
            'Como o aluno entra?',
            'Com o celular cadastrado na academia e um PIN de 4 a 6 números, criado no primeiro acesso. Depois o celular fica conectado. Se trocar de aparelho, entra de novo com o celular e o PIN; se esquecer o PIN, a recepção libera um novo primeiro acesso.',
        ],
        [
            'Meus dados e os dos alunos ficam seguros? E a LGPD?',
            'Cada academia só enxerga os próprios alunos. O aluno aceita o aviso de privacidade no primeiro acesso, o instrutor vê o celular mascarado e o PIN é bloqueado depois de várias tentativas erradas. Se um aluno pedir, você exclui os dados pessoais dele pelo painel e o histórico de treinos fica sem identificação.',
        ],
        [
            'Meus professores também usam?',
            'Sim. O instrutor tem o próprio acesso ao painel: cria e envia treinos e registra avaliações. Cadastro de alunos e avisos ficam com o dono.',
        ],
        [
            'Preciso de computador?',
            'Não. O painel funciona no celular e no computador.',
        ],
    ];
@endphp
<section id="faq" aria-labelledby="faq-titulo" class="bg-giz text-ferro">
    <div class="wrap grid gap-10 py-20 lg:grid-cols-12 lg:py-28">
        <div class="lg:col-span-4">
            <div class="lg:sticky lg:top-10">
                <p class="kicker text-grafite">Dúvidas</p>
                <h2 id="faq-titulo" class="display mt-5 text-[clamp(3rem,12.5vw,5rem)]">Perguntas de quem tem academia.</h2>
            </div>
        </div>
        <div class="faq border-t-4 border-ferro lg:col-span-8">
            @foreach ($perguntas as $item)
                @php([$pergunta, $resposta] = $item)
                <details class="group border-b border-ferro/20">
                    <summary class="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-5 font-cond text-xl font-bold uppercase sm:text-2xl">
                        {{ $pergunta }}
                        <span class="mais display shrink-0 text-3xl leading-none" aria-hidden="true">+</span>
                    </summary>
                    <p class="max-w-2xl pb-6 text-lg leading-snug text-grafite">{{ $resposta }}</p>
                    @if (isset($item[2]))
                        <a href="{{ $whatsapp($item[2]) }}" target="_blank" rel="noopener" class="btn btn-ferro mb-6">
                            <x-landing.whatsapp-icon class="size-5" /> Ver o valor no WhatsApp
                        </a>
                    @endif
                </details>
            @endforeach
        </div>
    </div>
</section>
