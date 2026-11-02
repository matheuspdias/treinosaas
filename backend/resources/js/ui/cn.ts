import { extendTailwindMerge } from 'tailwind-merge'

/** tailwind-merge ciente dos tokens próprios (para `px-1` vencer `px-4` da base, etc.). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['touch', 'touch-lg'],
      radius: ['card', 'control'],
      shadow: ['card', 'sheet'],
      text: ['display'],
    },
  },
})

/** Junta classes condicionais resolvendo conflitos: cn(base, cond && 'px-1'). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
