let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  ctx ??= new AudioContext()
  return ctx
}

/**
 * O iOS só libera áudio após um gesto do usuário. Chame isto num toque
 * (ex.: ao iniciar o treino ou concluir uma série).
 */
export function unlockAudio(): void {
  const c = getContext()
  if (c?.state === 'suspended') void c.resume()
}

/** Três bipes curtos, gerados na hora (sem arquivo de áudio). */
export function playRestEndSound(): void {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const start = c.currentTime + 0.02
  ;[0, 0.22, 0.44].forEach((offset, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = i === 2 ? 1320 : 880
    const t = start + offset
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.18)
  })
}
