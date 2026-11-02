import type { ReactNode } from 'react'
import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  open: (opts: ConfirmOptions) => Promise<boolean>
  close: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  open(opts) {
    get().request?.resolve(false)
    return new Promise<boolean>((resolve) => set({ request: { ...opts, resolve } }))
  },
  close(ok) {
    get().request?.resolve(ok)
    set({ request: null })
  },
}))

/** `if (await confirm({ title: 'Excluir?' })) ...` */
export const confirm = (opts: ConfirmOptions) => useConfirmStore.getState().open(opts)
