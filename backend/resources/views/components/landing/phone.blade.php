{{-- Print real do app numa moldura de celular. Os arquivos ficam em public/landing/img/{name}-{390,520,780}.webp. --}}
@props(['name', 'alt', 'eager' => false, 'sizes' => '(min-width: 1024px) 300px, 70vw'])
<div {{ $attributes->class('phone') }}>
    <img
        src="{{ asset("landing/img/{$name}-390.webp") }}"
        srcset="{{ asset("landing/img/{$name}-390.webp") }} 390w, {{ asset("landing/img/{$name}-520.webp") }} 520w, {{ asset("landing/img/{$name}-780.webp") }} 780w"
        sizes="{{ $sizes }}"
        width="390" height="844"
        alt="{{ $alt }}"
        @if ($eager) fetchpriority="high" @else loading="lazy" decoding="async" @endif
    >
</div>
