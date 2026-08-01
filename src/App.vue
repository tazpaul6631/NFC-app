<template>
  <!-- IonApp giữ shell Capacitor; routing dùng vue-router + <router-view> (ưu tiên PrimeVue) -->
  <ion-app :class="`device-${deviceType}`">
    <router-view />
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
import { onMounted, onUnmounted } from 'vue'
import { IonApp, useBackButton } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Device } from '@capacitor/device'
import { Network } from '@capacitor/network'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from '@/store/auth'
import { useDevice } from '@/composables/useDevice'

const router = useRouter()
const authStore = useAuthStore()
const { deviceType } = useDevice()

useBackButton(-1, () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    CapApp.exitApp()
  }
})

let networkHandle: { remove: () => Promise<void> } | undefined

onMounted(async () => {
  try {
    await SplashScreen.hide()
  } catch {
    /* web / chưa có plugin */
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const info = await Device.getInfo()
      if (info.platform !== 'web') {
        // Prefer light icons/text on light topbar; overlaysWebView=false helps pre-Android 15
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setOverlaysWebView({ overlay: false })
      }
    } catch {
      /* ignore — Android 15+ ignores overlaysWebView; SystemBars CSS insets apply instead */
    }
  }

  networkHandle = await Network.addListener('networkStatusChange', (status) => {
    authStore.setNetworkStatus(status.connected)
  })

  const current = await Network.getStatus()
  authStore.setNetworkStatus(current.connected)
})

onUnmounted(() => {
  networkHandle?.remove()
})
</script>
