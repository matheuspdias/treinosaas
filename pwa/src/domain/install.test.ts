import { installPlatform, shouldAskInstall } from './install'

const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidWebView:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36',
  instagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 337.0.0.0.77',
  facebook:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.0]',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

describe('installPlatform', () => {
  it('reconhece iPhone em qualquer navegador', () => {
    expect(installPlatform(UA.iphone)).toBe('ios')
    expect(installPlatform(UA.iphoneChrome)).toBe('ios')
  })

  it('reconhece iPad que se apresenta como Mac pelo toque', () => {
    expect(installPlatform(UA.ipad, 5)).toBe('ios')
    expect(installPlatform(UA.ipad, 0)).toBe('desktop')
  })

  it('reconhece Android', () => {
    expect(installPlatform(UA.android)).toBe('android')
  })

  it('reconhece navegador embutido em outro app', () => {
    expect(installPlatform(UA.instagram)).toBe('in_app')
    expect(installPlatform(UA.facebook)).toBe('in_app')
    expect(installPlatform(UA.androidWebView)).toBe('in_app')
  })

  it('trata o resto como computador', () => {
    expect(installPlatform(UA.windows)).toBe('desktop')
  })
})

describe('shouldAskInstall', () => {
  it('pede no celular fora do app instalado', () => {
    expect(shouldAskInstall('ios', false, false)).toBe(true)
    expect(shouldAskInstall('android', false, false)).toBe(true)
    expect(shouldAskInstall('in_app', false, false)).toBe(true)
  })

  it('não pede no computador, no app instalado nem depois de pular', () => {
    expect(shouldAskInstall('desktop', false, false)).toBe(false)
    expect(shouldAskInstall('android', true, false)).toBe(false)
    expect(shouldAskInstall('ios', false, true)).toBe(false)
  })
})
