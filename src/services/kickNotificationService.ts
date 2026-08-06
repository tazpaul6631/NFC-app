import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { KICK_TIMES, getReminderTimes } from '@/constants/kickSchedule'
import i18n from '@/i18n'

const REMINDER_ID_BASE = 1000
const KICK_ID_BASE = 2000

function reminderNotificationIds() {
  return getReminderTimes().map((_, index) => ({ id: REMINDER_ID_BASE + index }))
}

function buildReminderNotifications() {
  const t = i18n.global.t
  return getReminderTimes().map((time, index) => ({
    id: REMINDER_ID_BASE + index,
    title: String(t('checkin.kick.reminderTitle')),
    body: String(t('checkin.kick.reminderBody')),
    schedule: {
      on: { hour: time.hour, minute: time.minute },
      allowWhileIdle: true,
    },
    extra: { type: 'reminder' as const },
  }))
}

function buildKickNotifications() {
  const t = i18n.global.t
  return KICK_TIMES.map((time, index) => ({
    id: KICK_ID_BASE + index,
    title: String(t('checkin.kick.kickTitle')),
    body: String(t('checkin.kick.kickBody')),
    schedule: {
      on: { hour: time.hour, minute: time.minute },
      allowWhileIdle: true,
    },
    extra: { type: 'kick' as const },
  }))
}

/**
 * Đăng ký thông báo kick (luôn); reminder chỉ khi còn offline pending.
 */
export async function setupKickNotifications(options?: { hasPendingOffline?: boolean }) {
  if (!Capacitor.isNativePlatform()) return

  try {
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return

    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const notifications = [
      ...buildKickNotifications(),
      ...(options?.hasPendingOffline ? buildReminderNotifications() : []),
    ]

    await LocalNotifications.schedule({ notifications })
  } catch (e) {
    console.warn('setupKickNotifications failed:', e)
  }
}

/**
 * Bật/tắt schedule reminder theo trạng thái offlineQueue (không đụng kick).
 */
export async function syncReminderNotifications(hasPendingOffline: boolean) {
  if (!Capacitor.isNativePlatform()) return

  try {
    const permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') return

    await LocalNotifications.cancel({ notifications: reminderNotificationIds() })

    if (!hasPendingOffline) return

    await LocalNotifications.schedule({
      notifications: buildReminderNotifications(),
    })
  } catch (e) {
    console.warn('syncReminderNotifications failed:', e)
  }
}
