/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API da academia (ex.: http://localhost:8010/api). Sem ela, o modo academia fica escondido. */
  readonly VITE_API_URL?: string
  readonly VITE_EXERCISEDB_API_KEY?: string
  readonly VITE_EXERCISEDB_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
