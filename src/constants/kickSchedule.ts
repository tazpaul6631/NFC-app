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

/** Phút trong ngày từ chuỗi local `YYYY-MM-DDTHH:mm:ss` (giờ VN wall-clock) */
export function getVNMinutesFromLocalIso(iso: string): number | null {
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const KICK_MINUTES = toMinutesList(KICK_TIMES)

/** Mốc đá gần nhất đã qua trong ngày VN (null nếu chưa tới mốc đầu tiên) */
export function getLatestPassedKickMinute(date = new Date()): number | null {
  const current = getVNMinutesNow(date)
  const passed = KICK_MINUTES.filter((m) => m <= current)
  return passed.length ? Math.max(...passed) : null
}

/** Ca hiện tại bắt đầu trước mốc đá gần nhất → cần reset (catch-up) */
export function isDisplayStaleForKick(
  tripStartedAt: string | null,
  employeeCheckinAts: string[],
  date = new Date(),
): boolean {
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
