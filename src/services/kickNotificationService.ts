import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { KICK_TIMES, getReminderTimes } from '@/constants/kickSchedule'
import i18n from '@/i18n'

const REMINDER_ID_BASE = 1000
const KICK_ID_BASE = 2000

export async function setupKickNotifications() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return

    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const t = i18n.global.t
    const reminderTimes = getReminderTimes()

    const reminderNotifications = reminderTimes.map((time, index) => ({
      id: REMINDER_ID_BASE + index,
      title: String(t('checkin.kick.reminderTitle')),
      body: String(t('checkin.kick.reminderBody')),
      schedule: {
        on: { hour: time.hour, minute: time.minute },
        allowWhileIdle: true,
      },
      extra: { type: 'reminder' as const },
    }))

    const kickNotifications = KICK_TIMES.map((time, index) => ({
      id: KICK_ID_BASE + index,
      title: String(t('checkin.kick.kickTitle')),
      body: String(t('checkin.kick.kickBody')),
      schedule: {
        on: { hour: time.hour, minute: time.minute },
        allowWhileIdle: true,
      },
      extra: { type: 'kick' as const },
    }))

    await LocalNotifications.schedule({
      notifications: [...reminderNotifications, ...kickNotifications],
    })
  } catch (e) {
    console.warn('setupKickNotifications failed:', e)
  }
}
