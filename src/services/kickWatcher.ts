import {
  getReminderTimes,
  getVNMinutesNow,
  KICK_TIMES,
  toMinutesList,
} from '@/constants/kickSchedule'
import { useCheckinListStore } from '@/store/checkinList'
import { useCheckinStepStore } from '@/store/checkinStep'

/**
 * Poll mỗi 15s: mốc đá → reset display (+ step 1);
 * T−10' → modal nhắc nếu còn offlineQueue.
 * Kick & reminder: không persist theo ngày — chỉ tránh spam trong cùng phút (RAM).
 */
export function startKickWatcher() {
  const store = useCheckinListStore()
  const stepStore = useCheckinStepStore()
  const kickMinutes = toMinutesList(KICK_TIMES)
  const reminderMinutes = toMinutesList(getReminderTimes())
  /** Phút trong ngày đã xử lý (RAM) — rời phút rồi quay lại vẫn chạy lại */
  let lastKickMinute: number | null = null
  let lastReminderMinute: number | null = null

  const tick = () => {
    const currentMinute = getVNMinutesNow()

    if (kickMinutes.includes(currentMinute)) {
      if (lastKickMinute === currentMinute) return
      lastKickMinute = currentMinute
      store.resetDisplayList()
      stepStore.reset()
      return
    }

    lastKickMinute = null

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

  // Catch-up khi mở app đúng phút kick/reminder
  tick()
  const intervalId = setInterval(tick, 15 * 1000)
  return () => clearInterval(intervalId)
}
