import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
  /** ms; 0 = só fecha manualmente */
  duration: number
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) => number
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show(message, opts = {}) {
    const id = nextId++
    const toast: Toast = { id, message, tone: 'default', duration: 3500, ...opts }
    set({ toasts: [...get().toasts.slice(-2), toast] })
    if (toast.duration > 0) setTimeout(() => get().dismiss(id), toast.duration)
    return id
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
}))

export const toast = (message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>) =>
  useToastStore.getState().show(message, opts)
