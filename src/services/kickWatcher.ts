import {
  getReminderTimes,
  getVNMinutesNow,
  isDisplayStaleForKick,
  KICK_TIMES,
  toMinutesList,
} from '@/constants/kickSchedule'
import { useCheckinListStore } from '@/store/checkinList'
import { useCheckinStepStore } from '@/store/checkinStep'

/** Reset display ca (+ step 1). Không đụng offlineQueue. */
export function applyKickReset() {
  const store = useCheckinListStore()
  const stepStore = useCheckinStepStore()
  store.resetDisplayList()
  stepStore.reset()
}

/**
 * Catch-up: đã qua mốc đá mà ca cũ chưa reset (list hoặc trip).
 * List rỗng nhưng trip còn giờ ca trước → vẫn về step 1.
 */
export function runKickCatchUp(): boolean {
  const store = useCheckinListStore()
  if (!store.employees.length && !store.tripStartedAt) return false

  const stale = isDisplayStaleForKick(
    store.tripStartedAt,
    store.employees.map((e) => e.checkinAt),
  )
  if (!stale) return false

  applyKickReset()
  return true
}

/**
 * Poll mỗi 15s: catch-up ca cũ mỗi tick (bỏ lỡ phút / nhảy giờ);
 * đúng mốc đá → reset cả khi list rỗng;
 * T−10' → modal nhắc nếu còn offlineQueue.
 */
export function startKickWatcher() {
  const store = useCheckinListStore()
  const kickMinutes = toMinutesList(KICK_TIMES)
  const reminderMinutes = toMinutesList(getReminderTimes())
  /** Phút trong ngày đã xử lý (RAM) — rời phút rồi quay lại vẫn chạy lại */
  let lastKickMinute: number | null = null
  let lastReminderMinute: number | null = null

  const tick = () => {
    const currentMinute = getVNMinutesNow()

    runKickCatchUp()

    if (kickMinutes.includes(currentMinute)) {
      if (lastKickMinute !== currentMinute) {
        lastKickMinute = currentMinute
        applyKickReset()
      }
    } else {
      lastKickMinute = null
    }

    if (reminderMinutes.includes(currentMinute)) {
      if (lastReminderMinute === currentMinute) return
      lastReminderMinute = currentMinute
      if (store.offlinePendingCount > 0) {
        void store.showReminderModal(true)
      }
      return
    }

    lastReminderMinute = null
  }

  runKickCatchUp()
  tick()
  const intervalId = setInterval(tick, 15 * 1000)
  return () => clearInterval(intervalId)
}
