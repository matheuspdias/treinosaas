/** URL da API da academia (ex.: https://api.exemplo.com/api). Sem ela, o modo academia some do app. */
export const API_URL: string | null = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || null

export const academyEnabled = API_URL !== null
