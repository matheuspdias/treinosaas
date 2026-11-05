{{--
    Tela inicial de um celular feita em HTML/CSS: o app da academia demo entre ícones genéricos
    (traços no estilo Lucide, sem logo de marca real). Só a academia tem cor.
--}}
@php
    $icones = [
        'calendario' => '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        'fotos' => '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
        'camera' => '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
        'mapa' => '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
        'clima' => '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
        'notas' => '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6M16 13H8M16 17H8"/>',
        'relogio' => '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        'musica' => '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        'carteira' => '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
        'calculadora' => '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
        'ajustes' => '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
        'telefone' => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
        'mensagens' => '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        'navegador' => '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
        'email' => '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
    ];
    // null = o app da academia.
    $grade = [
        ['calendario', 'Agenda'], ['fotos', 'Fotos'], ['camera', 'Câmera'], ['mapa', 'Mapas'],
        ['clima', 'Clima'], null, ['notas', 'Notas'], ['relogio', 'Relógio'],
        ['musica', 'Música'], ['carteira', 'Banco'], ['calculadora', 'Calculadora'], ['ajustes', 'Ajustes'],
    ];
    $dock = ['telefone', 'mensagens', 'navegador', 'email'];
@endphp
<div {{ $attributes->class('phone') }} role="img" aria-label="Tela inicial do celular do aluno com o app Academia Demo entre os outros apps">
    <div class="tela-inicial" aria-hidden="true">
        <div class="status"><span>06:00</span><span class="bateria"></span></div>
        <ul class="apps">
            @foreach ($grade as $item)
                @if ($item === null)
                    <li class="academia">
                        <span class="icone"><img src="{{ asset('landing/img/academia-demo.svg') }}" alt="" width="48" height="48"></span>
                        <span class="rotulo">Academia Demo</span>
                    </li>
                @else
                    <li>
                        <span class="icone"><svg viewBox="0 0 24 24">{!! $icones[$item[0]] !!}</svg></span>
                        <span class="rotulo">{{ $item[1] }}</span>
                    </li>
                @endif
            @endforeach
        </ul>
        <ul class="dock">
            @foreach ($dock as $icone)
                <li><span class="icone"><svg viewBox="0 0 24 24">{!! $icones[$icone] !!}</svg></span></li>
            @endforeach
        </ul>
    </div>
</div>
