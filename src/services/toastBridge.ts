import type { ToastMessageOptions } from 'primevue/toast'

type ShowToastFn = (options: ToastMessageOptions) => void

let showToastFn: ShowToastFn | null = null
let lastServerMaintenanceAt = 0
let lastSessionExpiredAt = 0

const TOAST_COOLDOWN_MS = 4000

export function registerAppToast(fn: ShowToastFn) {
  showToastFn = fn
}

export function unregisterAppToast(fn?: ShowToastFn) {
  if (!fn || showToastFn === fn) {
    showToastFn = null
  }
}

export function showAppToast(options: ToastMessageOptions) {
  showToastFn?.(options)
}

/** Debounced toast khi BE lỗi / 5xx / mất kết nối — an toàn gọi từ Axios interceptor. */
export function notifyServerMaintenanceToast(detail: string, summary = 'Server') {
  const now = Date.now()
  if (now - lastServerMaintenanceAt < TOAST_COOLDOWN_MS) return
  lastServerMaintenanceAt = now

  showAppToast({
    severity: 'warn',
    summary,
    detail,
    life: 6000,
  })
}

export function notifySessionExpiredToast(detail: string, summary = 'Auth') {
  const now = Date.now()
  if (now - lastSessionExpiredAt < TOAST_COOLDOWN_MS) return
  lastSessionExpiredAt = now

  showAppToast({
    severity: 'warn',
    summary,
    detail,
    life: 4500,
  })
}
