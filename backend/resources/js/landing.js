// Landing de venda: revelação ao rolar e botão flutuante do WhatsApp. Sem dependências.
document.documentElement.classList.add('js')

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const reveal = document.querySelectorAll('[data-reveal]')
if (reduced || !('IntersectionObserver' in window)) {
  reveal.forEach((el) => el.classList.add('is-in'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  reveal.forEach((el) => io.observe(el))
}

// O botão só aparece com o hero fora da tela, e some quando a chamada final (que já tem o botão) aparece.
const float = document.querySelector('[data-wa-float]')
const hero = document.getElementById('topo')
const final = document.getElementById('contato')
if (float && hero && 'IntersectionObserver' in window) {
  const visible = new Map([
    [hero, true],
    [final, false],
  ])
  const update = () => {
    const hide = visible.get(hero) || visible.get(final)
    float.toggleAttribute('data-hidden', hide)
    float.toggleAttribute('inert', hide)
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) visible.set(entry.target, entry.isIntersecting)
    update()
  })
  io.observe(hero)
  if (final) io.observe(final)
}
