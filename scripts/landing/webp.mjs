// Fotos do Pexels (CREDITS.md) → WebP em preto e branco, 3 larguras. Baixe os JPGs em photos/raw antes.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const jobs = [
  { src: '/work/photos/raw/big-2261485.jpg', name: 'levantamento', widths: [640, 1024, 1600] },
  { src: '/work/photos/raw/big-27810163.jpg', name: 'barra-no-chao', widths: [480, 800, 1200] },
]
mkdirSync('/out', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent('<html><body></body></html>')
for (const job of jobs) {
  const data = 'data:image/jpeg;base64,' + readFileSync(job.src).toString('base64')
  for (const w of job.widths) {
    const b64 = await page.evaluate(async ({ data, w }) => {
      const img = new Image(); img.src = data; await img.decode()
      const h = Math.round(img.naturalHeight * (w / img.naturalWidth))
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const ctx = c.getContext('2d'); ctx.filter = 'grayscale(1) contrast(1.12)'; ctx.drawImage(img, 0, 0, w, h)
      return { url: c.toDataURL('image/webp', 0.72), h }
    }, { data, w })
    const file = `/out/${job.name}-${w}.webp`
    writeFileSync(file, Buffer.from(b64.url.split(',')[1], 'base64'))
    console.log(file, w + 'x' + b64.h)
  }
}
await browser.close()
