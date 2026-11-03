/** URL da API da academia (ex.: https://api.exemplo.com/api). O app só funciona com ela. */
export const API_URL: string | null = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || null
