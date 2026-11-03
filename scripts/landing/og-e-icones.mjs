// Prévia do link (og.jpg, a partir de og.html) e ícones da landing. Rode depois de landing-shots.mjs.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const browser = await chromium.launch()
const conv = await browser.newPage()
await conv.setContent('<html></html>')
async function save(png, path, w, type = 'image/webp', q = 0.8) {
  const data = 'data:image/png;base64,' + png.toString('base64')
  const url = await conv.evaluate(async ({ data, w, type, q }) => {
    const img = new Image(); img.src = data; await img.decode()
    const h = Math.round(img.naturalHeight * (w / img.naturalWidth))
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h)
    return c.toDataURL(type, q)
  }, { data, w, type, q })
  writeFileSync(path, Buffer.from(url.split(',')[1], 'base64'))
  console.log('ok', path)
}

// Prévia do link (Open Graph) e ícones
{
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await p.goto('file:///work/og.html')
  await p.waitForTimeout(800)
  await save(await p.screenshot(), '/pub/landing/og.jpg', 1200, 'image/jpeg', 0.86)
  const f = await browser.newPage({ viewport: { width: 180, height: 180 } })
  await f.goto('file:///pub/landing/favicon.svg')
  const icon = await f.screenshot({ omitBackground: true })
  await save(icon, '/pub/landing/apple-touch-icon.png', 180, 'image/png')
  await save(icon, '/pub/landing/favicon-32.png', 32, 'image/png')
}
await browser.close()
