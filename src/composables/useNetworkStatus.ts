import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Network, type ConnectionStatus } from '@capacitor/network'
import { useAuthStore } from '@/store/auth'

/**
 * Đồng bộ trạng thái mạng Capacitor → authStore.isOnline.
 * Gọi 1 lần ở layout/shell (tránh đăng ký listener trùng).
 */
export function useNetworkStatus() {
  const authStore = useAuthStore()
  const { isOnline } = storeToRefs(authStore)

  let networkHandle: { remove: () => Promise<void> } | undefined

  function applyStatus(status: ConnectionStatus) {
    authStore.setNetworkStatus(status.connected)
  }

  async function refreshNetworkStatus() {
    try {
      const status = await Network.getStatus()
      applyStatus(status)
    } catch {
      // Fallback web nếu plugin lỗi
      authStore.setNetworkStatus(typeof navigator !== 'undefined' ? navigator.onLine : true)
    }
  }

  onMounted(() => {
    void refreshNetworkStatus()
    void Network.addListener('networkStatusChange', applyStatus).then((handle) => {
      networkHandle = handle
    })

    // Backup cho web / trường hợp Capacitor miss event
    window.addEventListener('online', onBrowserOnline)
    window.addEventListener('offline', onBrowserOffline)
  })

  onUnmounted(() => {
    void networkHandle?.remove()
    window.removeEventListener('online', onBrowserOnline)
    window.removeEventListener('offline', onBrowserOffline)
  })

  function onBrowserOnline() {
    authStore.setNetworkStatus(true)
  }

  function onBrowserOffline() {
    authStore.setNetworkStatus(false)
  }

  return {
    isOnline,
    refreshNetworkStatus,
  }
}
