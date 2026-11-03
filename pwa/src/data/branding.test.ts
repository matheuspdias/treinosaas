vi.mock('./remote/config', () => ({
  API_URL: 'http://api.test/api',
  ACADEMY_SLUG: 'forca-total',
  APP_BASE: '/forca-total',
}))

const BRAND = {
  slug: 'forca-total',
  name: 'Academia Força Total',
  appName: 'Força',
  brandColor: '#2563eb',
  iconUrl: 'http://api.test/storage/icon.png?v=1',
}

function reply(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function load() {
  vi.resetModules()
  return import('./branding')
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('marca da academia', () => {
  it('busca pelo slug da URL e guarda para abrir offline', async () => {
    reply(200, BRAND)
    const first = await load()
    expect(first.getBrandingState()).toEqual({ status: 'loading' })
    await first.refreshBranding()
    expect(first.getBrandingState()).toEqual({ status: 'ready', branding: BRAND })

    // Próxima abertura, sem internet: já começa com a marca do cache.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    const again = await load()
    expect(again.getBrandingState()).toEqual({ status: 'ready', branding: BRAND })
    await again.refreshBranding()
    expect(again.getBrandingState()).toEqual({ status: 'ready', branding: BRAND })
  })

  it('academia que não existe', async () => {
    reply(404, { message: 'Academia não encontrada.' })
    const branding = await load()
    await branding.refreshBranding()
    expect(branding.getBrandingState()).toEqual({ status: 'not_found' })
  })

  it('primeira abertura sem internet segue com a marca padrão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    const branding = await load()
    await branding.refreshBranding()
    expect(branding.getBrandingState()).toMatchObject({
      status: 'ready',
      branding: { slug: 'forca-total', brandColor: null, iconUrl: null },
    })
  })
})
