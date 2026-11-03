/*
 * Ícones do app do aluno, gerados no navegador do painel (o servidor não processa imagem).
 * Dois PNGs 512×512 a partir do logo enviado:
 * - "any": logo grande sobre o fundo (iOS e computadores arredondam os cantos sozinhos);
 * - "maskable": logo menor, dentro da área segura que o Android recorta em círculo/gota.
 */

const SIZE = 512

export const ICON_BACKGROUNDS = {
  white: '#ffffff',
  black: '#0b0d10',
} as const

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível abrir essa imagem. Use PNG, JPG, WebP ou SVG.'))
    }
    img.src = url
  })
}

function draw(img: HTMLImageElement, background: string, scale: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = background
  ctx.fillRect(0, 0, SIZE, SIZE)
  const box = SIZE * scale
  const w = img.naturalWidth || SIZE
  const h = img.naturalHeight || SIZE
  const ratio = Math.min(box / w, box / h)
  const dw = w * ratio
  const dh = h * ratio
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar o ícone.'))),
      'image/png',
    ),
  )
}

export interface GeneratedIcons {
  icon: File
  maskable: File
  previewUrl: string
}

export async function generateIcons(logo: File, background: string): Promise<GeneratedIcons> {
  const img = await loadImage(logo)
  const [icon, maskable] = await Promise.all([
    draw(img, background, 0.8),
    draw(img, background, 0.6),
  ])
  return {
    icon: new File([icon], 'icon.png', { type: 'image/png' }),
    maskable: new File([maskable], 'maskable.png', { type: 'image/png' }),
    previewUrl: URL.createObjectURL(icon),
  }
}

/** Texto legível sobre a cor (preto ou branco), pela luminância relativa (WCAG). */
export function readableOn(hex: string): '#000000' | '#ffffff' {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const l = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  return l > 0.179 ? '#000000' : '#ffffff'
}
