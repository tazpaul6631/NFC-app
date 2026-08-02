import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import storageService from '@/services/storage.service'
import router from '@/router'

export interface AuthUser {
  id: string
  name: string
  role: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    token: '',
    isOnline: true,
    lastSync: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUserName: (state) => state.user?.name || 'Guest',
  },

  actions: {
    setToken(token: string) {
      this.token = token
      void Preferences.set({ key: 'vip_token', value: token })
    },

    setNetworkStatus(status: boolean) {
      this.isOnline = status
    },

    async login(username: string, _password: string) {
      // Demo login — thay bằng API thật khi sẵn sàng
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
      // Demo — thay bằng API thật khi sẵn sàng
      if (!currentPassword || !newPassword) {
        throw new Error('Invalid password')
      }
      await new Promise((resolve) => setTimeout(resolve, 600))
    },

    async logout() {
      this.token = ''
      this.user = null
      await Preferences.remove({ key: 'vip_token' })
      await storageService.clear()
      await router.push({ name: 'CheckinFlow' })
    },
  },

  persist: {
    key: 'vip_auth_storage',
    pick: ['token', 'user', 'lastSync'],
  },
})
