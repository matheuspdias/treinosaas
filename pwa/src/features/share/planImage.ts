import type { PlanColor } from '@/domain/types'

export interface PlanImageRow {
  name: string
  scheme: string
  detail?: string
}

export interface PlanImageInput {
  letter: string
  name: string
  color: PlanColor
  subtitle: string
  rows: PlanImageRow[]
}

const W = 1080
const PAD = 80
const FONT = '"Inter Variable", system-ui, sans-serif'

/** Cores do tema escuro lidas dos tokens (a imagem é sempre escura, com a marca do app). */
function darkTokens(color: PlanColor) {
  const probe = document.createElement('div')
  probe.dataset.theme = 'dark'
  probe.style.display = 'none'
  document.body.append(probe)
  const css = getComputedStyle(probe)
  const v = (n: string) => css.getPropertyValue(n).trim()
  const t = {
    bg: v('--c-bg'),
    surface: v('--c-surface'),
    fg: v('--c-fg'),
    muted: v('--c-fg-muted'),
    subtle: v('--c-fg-subtle'),
    border: v('--c-border'),
    accent: v('--c-accent'),
    plan: v(`--c-plan-${color}`),
  }
  probe.remove()
  return t
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > max) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  max: number,
  maxLines: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= max || !line) line = next
    else {
      lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = ellipsize(ctx, lines.slice(maxLines - 1).join(' '), max)
  return kept
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Desenha a ficha num PNG 1080 px de largura (≥ 4:5, bom para WhatsApp e Instagram). */
export async function renderPlanImage(input: PlanImageInput): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`800 72px ${FONT}`),
    document.fonts.load(`600 36px ${FONT}`),
    document.fonts.load(`400 28px ${FONT}`),
  ])
  const t = darkTokens(input.color)

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = `800 76px ${FONT}`
  const titleLines = wrap(measure, input.name, W - PAD * 2 - 160, 2)
  const rowHeights = input.rows.map((r) => (r.detail ? 132 : 100))
  const headerH = 120 + 140 + (titleLines.length - 1) * 84 + 100
  const listH = rowHeights.reduce((a, b) => a + b, 0) + 40
  const footerH = 170
  const H = Math.max(1350, headerH + listH + footerH)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'

  // Fundo e faixa na cor da ficha
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = t.plan
  ctx.fillRect(0, 0, W, 18)

  // Selo com a letra
  let y = 120
  roundRect(ctx, PAD, y, 140, 140, 32)
  ctx.fillStyle = t.plan
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.font = `800 84px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText(input.letter, PAD + 70, y + 100)
  ctx.textAlign = 'left'

  // Título e subtítulo
  ctx.fillStyle = t.fg
  ctx.font = `800 76px ${FONT}`
  const tx = PAD + 140 + 40
  titleLines.forEach((line, i) => ctx.fillText(line, tx, y + 66 + i * 84))
  ctx.fillStyle = t.muted
  ctx.font = `500 34px ${FONT}`
  ctx.fillText(input.subtitle, tx, y + 66 + (titleLines.length - 1) * 84 + 56)
  y = headerH

  // Lista de exercícios num cartão
  roundRect(ctx, PAD - 24, y - 20, W - (PAD - 24) * 2, listH, 36)
  ctx.fillStyle = t.surface
  ctx.fill()
  y += 20
  input.rows.forEach((row, i) => {
    const h = rowHeights[i]!
    const base = y + 62
    ctx.fillStyle = t.subtle
    ctx.font = `700 30px ${FONT}`
    ctx.fillText(String(i + 1).padStart(2, '0'), PAD, base)
    ctx.font = `700 36px ${FONT}`
    const schemeW = ctx.measureText(row.scheme).width
    ctx.fillStyle = t.fg
    ctx.font = `600 38px ${FONT}`
    ctx.fillText(ellipsize(ctx, row.name, W - PAD * 2 - 80 - schemeW - 32), PAD + 72, base)
    ctx.font = `700 36px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(row.scheme, W - PAD, base)
    ctx.textAlign = 'left'
    if (row.detail) {
      ctx.fillStyle = t.muted
      ctx.font = `400 28px ${FONT}`
      ctx.fillText(ellipsize(ctx, row.detail, W - PAD * 2 - 72), PAD + 72, base + 42)
    }
    if (i < input.rows.length - 1) {
      ctx.fillStyle = t.border
      ctx.fillRect(PAD + 72, y + h - 1, W - PAD * 2 - 72, 2)
    }
    y += h
  })

  // Rodapé com a marca
  const fy = H - 90
  roundRect(ctx, PAD, fy - 44, 56, 56, 14)
  ctx.fillStyle = t.accent
  ctx.fill()
  ctx.fillStyle = t.bg
  ctx.font = `800 34px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText('T', PAD + 28, fy - 4)
  ctx.textAlign = 'left'
  ctx.fillStyle = t.fg
  ctx.font = `700 32px ${FONT}`
  ctx.fillText('TreinoBox', PAD + 76, fy - 6)
  ctx.fillStyle = t.subtle
  ctx.font = `400 28px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('ficha de treino', W - PAD, fy - 6)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem'))),
      'image/png',
    ),
  )
}

/** Compartilha (WhatsApp, Instagram…) quando o aparelho permite; senão baixa o arquivo. */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  title: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
