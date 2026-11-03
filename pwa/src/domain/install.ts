/*
 * Instalação do app na tela do celular. O app instalado abre em tela cheia, com o ícone da
 * academia, e no iPhone guarda os dados separados do Safari: por isso a instalação vem antes
 * do login.
 */

export type InstallPlatform = 'ios' | 'android' | 'in_app' | 'desktop'

/** Navegadores embutidos em outros apps (Instagram, Facebook, TikTok...): neles não dá para instalar. */
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Snapchat|; wv\)/i

export function installPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (IN_APP.test(userAgent)) return 'in_app'
  // iPad com iPadOS se apresenta como Mac; o toque denuncia.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/Android/.test(userAgent)) return 'android'
  return 'desktop'
}

/** No celular, fora do app instalado, pede a instalação até o aluno escolher seguir no navegador. */
export function shouldAskInstall(
  platform: InstallPlatform,
  standalone: boolean,
  skipped: boolean,
): boolean {
  return platform !== 'desktop' && !standalone && !skipped
}
