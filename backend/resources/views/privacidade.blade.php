@php
    $email = config('landing.contact_email');
    $responsible = config('landing.privacy.responsible');
    $updatedAt = \Illuminate\Support\Carbon::parse(config('landing.privacy.updated_at'))->locale('pt_BR')->translatedFormat('j \d\e F \d\e Y');
    $title = "Política de privacidade | {$app}";
    $description = "Quais dados o {$app} guarda, para quê, como cada academia só vê os próprios alunos e como pedir a exclusão.";
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">
    <link rel="canonical" href="{{ route('privacy') }}">
    <meta name="theme-color" content="#121212">
    @include('landing.head')
</head>
<body class="bg-ferro text-giz">
    <a href="#conteudo" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-anilha focus:px-4 focus:py-3 focus:font-bold focus:text-ferro">Pular para o conteúdo</a>

    <header class="wrap flex items-center justify-between gap-4 py-4 lg:py-6">
        <a href="{{ url('/') }}" class="display text-3xl text-giz" aria-label="{{ $app }}, início">{{ $app }}<span class="text-anilha" aria-hidden="true">.</span></a>
        <a href="{{ url('/') }}" class="min-h-11 content-center px-2 font-cond text-base font-semibold tracking-wide text-cinza uppercase hover:text-giz">Voltar ao site</a>
    </header>

    <main id="conteudo" class="bg-giz text-ferro">
        <article class="politica wrap max-w-3xl py-16 lg:py-24">
            <p class="kicker text-grafite">Atualizada em {{ $updatedAt }}</p>
            <h1 class="display mt-5 text-[clamp(3rem,12vw,5.5rem)]">Política de privacidade</h1>
            <p class="mt-6 text-xl leading-snug">
                O {{ $app }} é um sistema para academias: um painel onde a academia monta os treinos e um app onde o aluno treina.
                Aqui explicamos quais dados guardamos, para quê e como pedir a exclusão, de acordo com a Lei Geral de Proteção de Dados (LGPD).
            </p>

            <h2>Quem é responsável pelos dados</h2>
            <p>
                A academia em que o aluno treina decide quem cadastrar e o que registrar: ela é a <strong>controladora</strong> dos dados dos alunos dela.
                O {{ $app }} guarda e processa esses dados em nome da academia, como <strong>operador</strong>.
            </p>
            <p>
                Responsável pelo {{ $app }}: {{ $responsible }}.
                @if ($email)
                    Contato: <a href="mailto:{{ $email }}">{{ $email }}</a>.
                @endif
            </p>

            <h2>Quais dados guardamos</h2>
            <h3>Do aluno</h3>
            <ul>
                <li><strong>Nome e celular</strong>, cadastrados pela academia. O celular é o login no app.</li>
                <li><strong>PIN de acesso</strong>, criado pelo aluno no primeiro acesso. Guardamos só uma versão cifrada: ninguém consegue ler o PIN, nem a academia nem nós.</li>
                <li><strong>Registros de treino</strong> das fichas da academia: data, exercícios, séries, repetições e cargas.</li>
                <li><strong>Avaliações físicas</strong>, se a academia registrar: peso, altura, percentual de gordura e medidas. São dados de saúde e só aparecem para o aluno e para a equipe da academia.</li>
                <li>A data em que o aluno aceitou o aviso de privacidade e a do último acesso.</li>
            </ul>
            <p>
                As fichas que o aluno cria sozinho no app ficam só no celular dele e não são enviadas para o {{ $app }}.
                Os treinos da academia também ficam guardados no celular, para o app funcionar sem internet.
            </p>
            <h3>Da equipe da academia</h3>
            <p>Nome, e-mail e senha (guardada cifrada) do dono e dos instrutores que usam o painel.</p>
            <h3>De quem visita o site</h3>
            <p>
                O painel usa um cookie de sessão, necessário para manter o login. Este site não usa cookies de publicidade nem ferramentas de rastreamento.
                Por segurança, o servidor registra o endereço IP e o horário dos acessos.
            </p>

            <h2>Para que usamos</h2>
            <ul>
                <li>Mostrar ao aluno os treinos que a academia montou para ele.</li>
                <li>Permitir que a academia acompanhe a frequência, as cargas e a evolução de cada aluno.</li>
                <li>Identificar o aluno no login e proteger a conta, por exemplo bloqueando o acesso depois de várias tentativas erradas de PIN.</li>
            </ul>
            <p>Não vendemos dados, não compartilhamos com anunciantes e não usamos para publicidade.</p>

            <h2>Cada academia só vê os próprios alunos</h2>
            <p>
                Os dados de cada academia ficam separados: o sistema confere a academia em cada consulta, e uma academia não consegue ver os alunos de outra.
                Se o aluno treina em mais de uma academia que usa o {{ $app }}, cada uma vê só o que foi registrado com ela.
                Dentro da academia, o instrutor vê o celular do aluno mascarado.
            </p>

            <h2>Onde os dados ficam</h2>
            <p>
                Em servidores da DigitalOcean no Canadá (Toronto), com conexão criptografada (HTTPS).
                Por ser fora do Brasil, é uma transferência internacional de dados, feita com as garantias contratuais de proteção de dados do provedor.
            </p>

            <h2>Por quanto tempo</h2>
            <p>
                Enquanto o aluno tiver cadastro na academia e a academia usar o {{ $app }}.
                Quando a academia exclui os dados de um aluno, apagamos nome, celular, PIN e avaliações físicas.
                Os registros de treino continuam só como números sem identificação, para as estatísticas da academia.
            </p>

            <h2>Seus direitos e como pedir a exclusão</h2>
            <p>
                Pela LGPD, você pode pedir para confirmar se tratamos seus dados, acessá-los, corrigi-los ou excluí-los.
                O caminho mais rápido é falar com a recepção da sua academia: ela corrige ou exclui seus dados pelo painel na hora.
                @if ($email)
                    Se preferir, escreva para <a href="mailto:{{ $email }}">{{ $email }}</a>: respondemos em até 15 dias.
                @endif
            </p>

            <h2>Mudanças nesta política</h2>
            <p>Quando esta política mudar, atualizamos a data no topo da página.</p>
        </article>
    </main>

    @include('landing.rodape')
</body>
</html>
