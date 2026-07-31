import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { loadDeviceView } from '@/composables/useDevice'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * Routing: vue-router (ưu tiên).
 * Ionic Vue Router chỉ cần khi bắt buộc dùng ion-router-outlet / page stack —
 * hiện tại MainLayout + views dùng PrimeVue + <router-view>.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: loadDeviceView('LoginView'),
    meta: { requiresAuth: false, title: 'Login' },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'Home' },
      },
      {
        path: 'home',
        name: 'Home',
        component: loadDeviceView('HomeView'),
        meta: { requiresAuth: true, title: 'Home', icon: 'pi pi-home' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: loadDeviceView('SettingsView'),
        meta: { requiresAuth: true, title: 'Settings', icon: 'pi pi-cog' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, title: '404' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = !!authStore.token

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'Login' && isAuthenticated) {
    return { name: 'Home' }
  }

  return true
})

export default router
