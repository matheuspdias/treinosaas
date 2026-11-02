/** Passo "redondo" (1, 2, 2,5, 5 × 10ⁿ) próximo de `raw`. */
function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * pow
}

/**
 * Domínio e marcas de eixo com números limpos (ex.: 60 / 70 / 80) que cobrem [min, max].
 * Nunca desce abaixo de zero.
 */
export function niceScale(
  min: number,
  max: number,
  targetTicks = 4,
): { domain: [number, number]; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { domain: [0, 1], ticks: [0, 1] }
  let lo = Math.min(min, max)
  let hi = Math.max(min, max)
  if (hi === lo) {
    const pad = hi === 0 ? 1 : Math.abs(hi) * 0.1
    lo -= pad
    hi += pad
  }
  const step = niceStep((hi - lo) / Math.max(1, targetTicks - 1))
  const start = Math.max(0, Math.floor(lo / step) * step)
  const end = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return { domain: [ticks[0]!, ticks.at(-1)!], ticks }
}
