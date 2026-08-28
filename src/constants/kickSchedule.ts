export interface KickTime {
  hour: number
  minute: number
}

/** 6 mốc đá (đã trừ 30 phút từ khung gốc) — giờ VN */
export const KICK_TIMES: KickTime[] = [
  { hour: 5, minute: 0 },
  { hour: 8, minute: 30 },
  { hour: 11, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 22, minute: 0 },
  { hour: 23, minute: 0 },
]

const REMINDER_OFFSET_MINUTES = 10

export function getReminderTimes(): KickTime[] {
  return KICK_TIMES.map(({ hour, minute }) => {
    const total = hour * 60 + minute - REMINDER_OFFSET_MINUTES
    const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
    return { hour: Math.floor(normalized / 60), minute: normalized % 60 }
  })
}

export function toMinutesList(times: KickTime[]): number[] {
  return times.map((t) => t.hour * 60 + t.minute)
}

/** Phút trong ngày theo giờ Việt Nam (UTC+7) */
export function getVNMinutesNow(date = new Date()): number {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes()
  return (utcMinutes + 7 * 60) % (24 * 60)
}

/** Ngày VN dạng `YYYY-MM-DD` (UTC+7 wall-clock) */
export function getVNDateKey(date = new Date()): string {
  return formatVNWallClock(date).slice(0, 10)
}

/** `YYYY-MM-DDTHH:mm:ss` theo giờ VN (UTC+7), không gắn `Z` */
export function formatVNWallClock(date = new Date()): string {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`
}

/** Phút trong ngày từ chuỗi local `YYYY-MM-DDTHH:mm:ss` (giờ VN wall-clock) */
export function getVNMinutesFromLocalIso(iso: string): number | null {
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Ngày từ chuỗi local `YYYY-MM-DDTHH:mm:ss` */
export function getDateKeyFromLocalIso(iso: string): string | null {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

const KICK_MINUTES = toMinutesList(KICK_TIMES)

/** Mốc đá gần nhất đã qua trong ngày VN (null nếu chưa tới mốc đầu tiên) */
export function getLatestPassedKickMinute(date = new Date()): number | null {
  const current = getVNMinutesNow(date)
  const passed = KICK_MINUTES.filter((m) => m <= current)
  return passed.length ? Math.max(...passed) : null
}

/**
 * Record còn trong cửa sổ ca hiện tại (cùng ngày VN và ≥ mốc đá gần nhất đã qua).
 * Dùng cho FE dedupe — bỏ qua data sót ca/ngày trước nếu chưa kịp kick-reset.
 */
export function isCheckinAtInCurrentKickWindow(iso: string, date = new Date()): boolean {
  const todayKey = getVNDateKey(date)
  const dateKey = getDateKeyFromLocalIso(iso)
  if (dateKey && dateKey < todayKey) return false

  const minutes = getVNMinutesFromLocalIso(iso)
  if (minutes === null) return Boolean(dateKey)

  const latestKick = getLatestPassedKickMinute(date)
  if (latestKick === null) return true
  return minutes >= latestKick
}

/**
 * Ca hiện tại cần reset (catch-up):
 * - Timestamp display thuộc ngày VN trước hôm nay → stale (qua đêm / bỏ lỡ kick)
 * - Cùng ngày và bắt đầu trước mốc đá gần nhất đã qua → stale
 */
export function isDisplayStaleForKick(
  tripStartedAt: string | null,
  employeeCheckinAts: string[],
  date = new Date(),
): boolean {
  const todayKey = getVNDateKey(date)
  const allIsos = [...(tripStartedAt ? [tripStartedAt] : []), ...employeeCheckinAts]

  for (const iso of allIsos) {
    const dateKey = getDateKeyFromLocalIso(iso)
    if (dateKey && dateKey < todayKey) return true
  }

  const latestKick = getLatestPassedKickMinute(date)
  if (latestKick === null) return false

  let tripMinutes: number | null = null
  if (tripStartedAt) {
    tripMinutes = getVNMinutesFromLocalIso(tripStartedAt)
  } else if (employeeCheckinAts.length) {
    for (const iso of employeeCheckinAts) {
      const m = getVNMinutesFromLocalIso(iso)
      if (m !== null && (tripMinutes === null || m < tripMinutes)) tripMinutes = m
    }
  }

  if (tripMinutes === null) return false
  return tripMinutes < latestKick
}
