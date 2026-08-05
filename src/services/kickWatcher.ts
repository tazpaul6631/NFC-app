import {
  formatKickKey,
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
 */
export function startKickWatcher() {
  const store = useCheckinListStore()
  const stepStore = useCheckinStepStore()
  const kickMinutes = toMinutesList(KICK_TIMES)
  const reminderMinutes = toMinutesList(getReminderTimes())

  const tick = () => {
    const currentMinute = getVNMinutesNow()
    const key = formatKickKey()

    if (kickMinutes.includes(currentMinute)) {
      if (store.lastKickKey === key) return
      store.lastKickKey = key
      store.resetDisplayList()
      stepStore.reset()
      return
    }

    if (reminderMinutes.includes(currentMinute)) {
      if (store.lastReminderKey === key) return
      store.lastReminderKey = key
      if (store.offlinePendingCount > 0) {
        void store.showReminderModal(true)
      }
    }
  }

  // Catch-up khi mở app đúng phút kick/reminder
  tick()
  const intervalId = setInterval(tick, 15 * 1000)
  return () => clearInterval(intervalId)
}
