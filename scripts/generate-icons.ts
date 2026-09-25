/**
 * Gera os ícones do PWA a partir de um SVG (halter verde-limão em fundo escuro).
 * Uso: npx tsx scripts/generate-icons.ts
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const BG = '#0b0d10'
const FG = '#b8f24a'

/** Halter num quadro 100×100; `scale` encolhe o desenho (zona segura do ícone maskable). */
function svg({ scale = 1, rounded = true }: { scale?: number; rounded?: boolean } = {}): string {
  const t = `translate(50 50) scale(${scale}) rotate(-45) translate(-50 -50)`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${rounded ? 22 : 0}" fill="${BG}"/>
  <g transform="${t}" fill="${FG}">
    <rect x="28" y="46" width="44" height="8" rx="3"/>
    <rect x="16" y="30" width="12" height="40" rx="4"/>
    <rect x="72" y="30" width="12" height="40" rx="4"/>
    <rect x="8" y="38" width="8" height="24" rx="3"/>
    <rect x="84" y="38" width="8" height="24" rx="3"/>
  </g>
</svg>`
}

async function png(file: string, size: number, source: string): Promise<void> {
  await sharp(Buffer.from(source))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLIC, file))
}

await writeFile(join(PUBLIC, 'favicon.svg'), svg())
await png('pwa-192.png', 192, svg({ rounded: false }))
await png('pwa-512.png', 512, svg({ rounded: false }))
await png('pwa-512-maskable.png', 512, svg({ scale: 0.72, rounded: false }))
await png('apple-touch-icon.png', 180, svg({ scale: 0.9, rounded: false }))
console.log('Ícones gerados em public/')
