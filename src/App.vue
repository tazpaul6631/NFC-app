<template>
  <!-- IonApp giữ shell Capacitor; routing dùng vue-router + <router-view> (ưu tiên PrimeVue) -->
  <ion-app :class="`device-${deviceType}`">
    <router-view />
    <OfflineSyncModal is-reminder />
    <Toast position="top-center" :class="['vip-toast', `vip-toast--${deviceType}`]" :pt="{
      root: { class: ['vip-toast', `vip-toast--${deviceType}`] },
      message: { class: 'vip-toast-message' },
      messageContent: { class: 'vip-toast-message-content' },
      summary: { class: 'vip-toast-summary' },
      detail: { class: 'vip-toast-detail' },
    }" />
    <ConfirmDialog />
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { IonApp, useBackButton } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Network } from '@capacitor/network'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useDevice } from '@/composables/useDevice'
import { useAuthStore } from '@/store/auth'
import { migrateCheckinListStore, useCheckinListStore } from '@/store/checkinList'
import { useCheckinStepStore } from '@/store/checkinStep'
import { registerAppToast, unregisterAppToast } from '@/services/toastBridge'
import {
  setupKickNotifications,
  syncReminderNotifications,
} from '@/services/kickNotificationService'
import { startKickWatcher } from '@/services/kickWatcher'
import { syncOfflineQueue } from '@/services/offlineSyncService'
import OfflineSyncModal from '@/components/OfflineSyncModal.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const checkinListStore = useCheckinListStore()
const checkinStepStore = useCheckinStepStore()
const { deviceType } = useDevice()

const showToast = (options: Parameters<typeof toast.add>[0]) => toast.add(options)
registerAppToast(showToast)

let stopKickWatcher: (() => void) | null = null
const listenerHandles: { remove: () => Promise<void> }[] = []

useBackButton(-1, () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    CapApp.exitApp()
  }
})

/** Reminder OS chỉ schedule khi còn offline pending */
watch(
  () => checkinListStore.offlinePendingCount,
  (count, prev) => {
    if (count > 0 === (prev ?? 0) > 0) return
    void syncReminderNotifications(count > 0)
  },
)

onMounted(async () => {
  try {
    await SplashScreen.hide()
  } catch {
    /* web / chưa có plugin */
  }

  await authStore.hydrateCachedNumberPlates()
  migrateCheckinListStore()

  await setupKickNotifications({
    hasPendingOffline: checkinListStore.offlinePendingCount > 0,
  })
  stopKickWatcher = startKickWatcher()

  if (authStore.isOnline && checkinListStore.offlinePendingCount > 0) {
    void syncOfflineQueue({ silent: true })
  }

  try {
    const notifHandle = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      async (action) => {
        const type = action.notification.extra?.type
        if (type === 'reminder') {
          if (checkinListStore.offlinePendingCount > 0) {
            await checkinListStore.showReminderModal(true)
          }
        }
        if (type === 'kick') {
          checkinListStore.resetDisplayList()
          checkinStepStore.reset()
        }
      },
    )
    listenerHandles.push(notifHandle)
  } catch {
    /* web */
  }

  try {
    const appHandle = await CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && authStore.isOnline && checkinListStore.offlinePendingCount > 0) {
        void syncOfflineQueue({ silent: true })
      }
    })
    listenerHandles.push(appHandle)
  } catch {
    /* web */
  }

  try {
    const netHandle = await Network.addListener('networkStatusChange', async (status) => {
      authStore.setNetworkStatus(status.connected)
      if (status.connected && checkinListStore.offlinePendingCount > 0) {
        void syncOfflineQueue({ silent: true })
      }
    })
    listenerHandles.push(netHandle)
  } catch {
    /* web */
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const info = await Device.getInfo()
      if (info.platform !== 'web') {
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setOverlaysWebView({ overlay: false })
      }
    } catch {
      /* ignore */
    }
  }
})

onUnmounted(() => {
  stopKickWatcher?.()
  listenerHandles.forEach((h) => void h.remove())
  unregisterAppToast(showToast)
})
</script>
