/** Minúsculas, sem acentos, hífens/underscores viram espaço, espaços colapsados. */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-_/()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Letra da ficha pela posição: 0 → A, 1 → B... 26 → AA. */
export function sequenceLetter(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}
