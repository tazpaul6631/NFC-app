import i18n from '@/i18n'

export type ApiMessagePayload = {
  status?: string | null
  message?: string | null
} | null | undefined

/**
 * Ưu tiên dịch theo `status` (error.*) trong locale;
 * không khớp / không có status → dùng `message` từ BE;
 * cuối cùng mới fallback key i18n.
 */
export function resolveApiMessage(payload: ApiMessagePayload, fallbackKey?: string): string {
  const t = i18n.global.t
  const te = i18n.global.te
  const status = String(payload?.status || '').trim()
  if (status) {
    const key = `error.${status}`
    if (te(key)) return String(t(key))
  }
  const message = String(payload?.message || '').trim()
  if (message) return message
  return fallbackKey ? String(t(fallbackKey)) : ''
}

/** Lấy payload status/message từ Axios error.response.data */
export function resolveApiError(err: unknown, fallbackKey?: string): string {
  const data = (err as { response?: { data?: ApiMessagePayload } })?.response?.data
  return resolveApiMessage(data, fallbackKey)
}
