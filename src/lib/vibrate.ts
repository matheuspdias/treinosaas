/** Vibração (Android). No iOS a API não existe e a chamada é ignorada. */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignorado
    }
  }
}

export const REST_END_VIBRATION = [200, 100, 200, 100, 400]
export const TAP_VIBRATION = 15
