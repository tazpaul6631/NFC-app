import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * Routing: vue-router (ưu tiên).
 * Hiện chỉ mở CheckinFlow — Login / Home / Settings tạm ẩn khỏi route.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'CheckinFlow',
        component: () => import('@/views/mobile/CheckinFlowView.vue'),
        meta: { title: 'Checkin', icon: 'pi pi-qrcode' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'CheckinFlow' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
