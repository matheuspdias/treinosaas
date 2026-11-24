/*
 * Service worker do painel: o mínimo para instalar como app.
 * Não guarda páginas nem dados (o painel tem login e dados de alunos): tudo vem da rede.
 * Sem internet, quem abre o app vê um aviso em vez da tela de erro do navegador.
 */
const CACHE = 'painel-v1'
const OFFLINE = '/painel/offline.html'
const ICON = '/painel/icon-192.png'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, ICON])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)))
  } else if (new URL(request.url).pathname === ICON) {
    // O ícone da página sem internet.
    event.respondWith(fetch(request).catch(() => caches.match(ICON)))
  }
})
