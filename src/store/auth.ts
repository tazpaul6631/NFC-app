import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import storageService from '@/services/storage.service'
import {
  loadCachedNumberPlates,
  saveCachedNumberPlates,
} from '@/services/vehiclePlateCache'
import router from '@/router'

/** Lazy — tránh circular import auth ↔ checkinList lúc init module */
async function getCheckinListStore() {
  const { useCheckinListStore } = await import('@/store/checkinList')
  return useCheckinListStore()
}

export interface AuthUser {
  id: string
  name: string
  role: string
}

export interface DriverSession {
  numberPlate: string
  accessToken: string
  expiresAt: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    token: '',
    numberPlate: '' as string,
    /** Chỉ lưu token expiry từ BE — không dùng để clear danh sách điểm danh */
    expiresAt: null as string | null,
    cachedNumberPlates: [] as string[],
    isOnline: true,
    lastSync: null as string | null,
    platesHydrated: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUserName: (state) => state.user?.name || 'Guest',
    offlineVehicleOptions: (state) =>
      state.cachedNumberPlates.map((plate) => ({ label: plate, value: plate })),
  },

  actions: {
    setToken(token: string) {
      this.token = token
      void Preferences.set({ key: 'vip_token', value: token })
    },

    setDriverSession(session: DriverSession) {
      const nextPlate = session.numberPlate.trim()
      const plateChanged = !!this.numberPlate && this.numberPlate.trim() !== nextPlate
      // Đổi xe → chỉ reset display ca hiện tại, giữ offlineQueue
      if (plateChanged) {
        void getCheckinListStore().then((checkinList) => {
          checkinList.resetDisplayList()
        })
      }

      this.setToken(session.accessToken)
      this.numberPlate = nextPlate
      this.expiresAt = session.expiresAt
    },

    async setCachedNumberPlates(plates: string[]) {
      const unique = [...new Set(plates.map((p) => p.trim()).filter(Boolean))]
      this.cachedNumberPlates = unique
      this.lastSync = new Date().toISOString()
      this.platesHydrated = true
      await saveCachedNumberPlates(unique)
    },

    async hydrateCachedNumberPlates() {
      try {
        const { plates, lastSync } = await loadCachedNumberPlates()

        if (plates.length > 0) {
          this.cachedNumberPlates = plates
          if (lastSync) this.lastSync = lastSync
        } else if (this.cachedNumberPlates.length > 0) {
          await saveCachedNumberPlates(this.cachedNumberPlates)
        }
      } finally {
        this.platesHydrated = true
      }
    },

    setNetworkStatus(status: boolean) {
      this.isOnline = status
    },

    async login(username: string, _password: string) {
      const token = `demo-token-${Date.now()}`
      this.setToken(token)
      this.user = {
        id: '1',
        name: username || 'Admin',
        role: 'Developer',
      }
      await router.push({ name: 'CheckinFlow' })
    },

    async changePassword(currentPassword: string, newPassword: string) {
      if (!currentPassword || !newPassword) {
        throw new Error('Invalid password')
      }
      await new Promise((resolve) => setTimeout(resolve, 600))
    },

    async logout() {
      const checkinList = await getCheckinListStore()
      checkinList.clearAll()
      this.token = ''
      this.user = null
      this.numberPlate = ''
      this.expiresAt = null
      await Preferences.remove({ key: 'vip_token' })
      await storageService.remove('vip_token')
      await router.push({ name: 'CheckinFlow' })
    },
  },

  persist: {
    key: 'vip_auth_storage',
    pick: ['token', 'user', 'numberPlate', 'expiresAt', 'cachedNumberPlates', 'lastSync'],
  },
})
