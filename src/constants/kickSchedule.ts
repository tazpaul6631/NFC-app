export interface KickTime {
  hour: number
  minute: number
}

/** 6 mốc đá (đã trừ 30 phút từ khung gốc) — giờ VN */
export const KICK_TIMES: KickTime[] = [
  { hour: 4, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 10, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 21, minute: 0 },
  { hour: 22, minute: 0 },
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
