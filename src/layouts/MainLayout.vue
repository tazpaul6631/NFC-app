<template>
  <div class="main-layout" :class="deviceType">
    <!-- Sidebar desktop / tablet -->
    <aside v-show="!isMobile" class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <button type="button" class="sidebar-brand" :title="t('common.home')" @click="go('/home')">
        <i class="pi pi-shield brand-icon vip-brand-icon" />
        <span class="brand-text">{{ t('common.appName') }}</span>
      </button>

      <nav class="sidebar-nav">
        <button v-for="item in menuItems" :key="item.to" type="button" class="nav-item"
          :class="{ active: isActive(item.to) }" :title="item.label" @click="go(item.to)">
          <i :class="item.icon" />
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Mobile drawer -->
    <Drawer v-model:visible="mobileMenuOpen" position="left" class="mobile-drawer"
      :pt="{ root: { style: 'width: 200px' } }">
      <template #header>
        <button type="button" class="sidebar-brand-mobile" :title="t('common.home')" @click="goMobile('/home')">
          <i class="pi pi-shield brand-icon vip-brand-icon" />
          <span class="brand-text">{{ t('common.appName') }}</span>
        </button>
      </template>
      <nav class="sidebar-nav drawer-nav">
        <button v-for="item in menuItems" :key="item.to" type="button" class="nav-item"
          :class="{ active: isActive(item.to) }" @click="goMobile(item.to)">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </Drawer>

    <div class="main-column">
      <header class="topbar">
        <div class="topbar-left">
          <Button class="collapse-btn" icon="pi pi-bars" text :aria-label="isMobile ? 'Menu' : 'Toggle sidebar'"
            @click="isMobile ? (mobileMenuOpen = true) : (sidebarCollapsed = !sidebarCollapsed)" />
        </div>

        <div class="topbar-right">
          <Tag :severity="authStore.isOnline ? 'success' : 'danger'" class="network-tag"
            :aria-label="authStore.isOnline ? t('common.online') : t('common.offline')">
            <span class="network-status">
              <i class="pi pi-wifi" />
              <span v-if="!authStore.isOnline" class="network-offline-mark">!</span>
            </span>
          </Tag>

          <Select v-model="locale" :options="locales" option-label="label" option-value="value" class="locale-select"
            aria-label="Language" @change="applyLocale">
            <template #value="{ value }">
              <span v-if="getLocaleOption(value)" class="locale-option">
                <img :src="getLocaleOption(value)!.flag" alt="" class="locale-flag" />
                <span class="locale-label">{{ getLocaleOption(value)!.label }}</span>
              </span>
            </template>
            <template #option="{ option }">
              <span class="locale-option">
                <img :src="option.flag" alt="" class="locale-flag" />
                <span class="locale-label">{{ option.label }}</span>
              </span>
            </template>
          </Select>

          <Button type="button" class="profile-btn" text @click="toggleProfileMenu" aria-haspopup="true"
            aria-controls="profile_menu">
            <Avatar :label="avatarLetter" shape="circle" />
            <span v-if="!isMobile" class="profile-meta">
              <strong>{{ authStore.getUserName }}</strong>
              <small>{{ authStore.user?.role || 'User' }}</small>
            </span>
            <i class="pi pi-chevron-down ml-2" />
          </Button>
          <Menu id="profile_menu" ref="profileMenu" :model="profileMenuItems" popup />
        </div>
      </header>

      <Dialog v-model:visible="changePasswordVisible" modal :header="t('changePassword.title')"
        :style="{ width: 'min(420px, 92vw)' }" :draggable="false" @hide="resetChangePasswordForm">
        <form class="change-password-form" @submit.prevent="submitChangePassword">
          <div class="field">
            <label for="current-password">{{ t('changePassword.current') }}</label>
            <Password id="current-password" v-model="currentPassword" class="w-full" input-class="w-full"
              :feedback="false" toggle-mask autocomplete="current-password" />
          </div>
          <div class="field">
            <label for="new-password">{{ t('changePassword.new') }}</label>
            <Password id="new-password" v-model="newPassword" class="w-full" input-class="w-full" toggle-mask
              autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="confirm-password">{{ t('changePassword.confirm') }}</label>
            <Password id="confirm-password" v-model="confirmPassword" class="w-full" input-class="w-full"
              :feedback="false" toggle-mask autocomplete="new-password" />
          </div>
        </form>

        <template #footer>
          <Button :label="t('common.cancel')" severity="secondary" text @click="closeChangePasswordDialog" />
          <Button :label="t('changePassword.submit')" icon="pi pi-check" :loading="changePasswordLoading"
            @click="submitChangePassword" />
        </template>
      </Dialog>

      <main class="content">
        <Breadcrumb class="content-breadcrumb p-2" :home="breadcrumbHome" :model="breadcrumbItems" />
        <div class="content-body">
          <router-view v-slot="{ Component, route: currentRoute }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="currentRoute.path" />
            </transition>
          </router-view>
        </div>

        <footer class="footer">
          <div class="footer-left">
            <img :src="logoCompany" alt="JIA HSIN" class="footer-logo" />
          </div>
          <div class="footer-right">
            <span>© 2026 IT Jia Hsin CO., LTD</span>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import type { MenuItem } from 'primevue/menuitem'
import Dialog from 'primevue/dialog'
import { useAuthStore } from '@/store/auth'
import { useDevice } from '@/composables/useDevice'
import flagVi from '@/assets/images/flag-vi.png'
import flagEn from '@/assets/images/flag-en.png'
import flagZh from '@/assets/images/flag-zh-tw.png'
import logoCompany from '@/assets/images/logo-company.png'

const localeOptions = [
  { label: 'Tiếng Việt', shortLabel: 'VI', value: 'vi', flag: flagVi },
  { label: 'English', shortLabel: 'EN', value: 'en', flag: flagEn },
  { label: '繁體中文', shortLabel: 'ZH', value: 'zh', flag: flagZh },
]

const { t, locale } = useI18n()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { deviceType, isMobile } = useDevice()

const sidebarCollapsed = ref(true)
const mobileMenuOpen = ref(false)
const profileMenu = ref()
const changePasswordVisible = ref(false)
const changePasswordLoading = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const locales = computed(() =>
  localeOptions.map((item) => ({
    ...item,
    label: isMobile.value ? item.shortLabel : item.label,
  })),
)

function getLocaleOption(value: string) {
  const item = localeOptions.find((option) => option.value === value)
  if (!item) return null
  return {
    ...item,
    label: isMobile.value ? item.shortLabel : item.label,
  }
}

const menuItems = computed(() => [
  { label: t('common.home'), to: '/home', icon: 'pi pi-home' },
  { label: 'Settings', to: '/settings', icon: 'pi pi-cog' },
])

const avatarLetter = computed(() => (authStore.getUserName || 'U').charAt(0).toUpperCase())

const breadcrumbHome = { icon: 'pi pi-home', command: () => router.push('/home') }
const breadcrumbItems = computed<MenuItem[]>(() => {
  const title = (route.meta.title as string) || ''
  if (!title || route.name === 'Home') return []
  return [{ label: title }]
})

const profileMenuItems = computed<MenuItem[]>(() => [
  {
    label: t('changePassword.menu'),
    icon: 'pi pi-key',
    command: () => openChangePasswordDialog(),
  },
  {
    label: t('common.logout'),
    icon: 'pi pi-sign-out',
    command: () => authStore.logout(),
  },
])

function openChangePasswordDialog() {
  resetChangePasswordForm()
  changePasswordVisible.value = true
}

function closeChangePasswordDialog() {
  changePasswordVisible.value = false
  resetChangePasswordForm()
}

function resetChangePasswordForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

async function submitChangePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    toast.add({
      severity: 'warn',
      summary: t('common.appName'),
      detail: t('changePassword.required'),
      life: 2500,
    })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.add({
      severity: 'warn',
      summary: t('common.appName'),
      detail: t('changePassword.mismatch'),
      life: 2500,
    })
    return
  }

  if (newPassword.value.length < 6) {
    toast.add({
      severity: 'warn',
      summary: t('common.appName'),
      detail: t('changePassword.tooShort'),
      life: 2500,
    })
    return
  }

  changePasswordLoading.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    toast.add({
      severity: 'success',
      summary: t('changePassword.successTitle'),
      detail: t('changePassword.successDetail'),
      life: 3000,
    })
    closeChangePasswordDialog()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.appName'),
      detail: error instanceof Error ? error.message : t('changePassword.failed'),
      life: 3000,
    })
  } finally {
    changePasswordLoading.value = false
  }
}

function applyLocale() {
  localStorage.setItem('vip_locale', String(locale.value))
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function go(path: string) {
  router.push(path)
}

function goMobile(path: string) {
  mobileMenuOpen.value = false
  router.push(path)
}

function toggleProfileMenu(event: Event) {
  profileMenu.value.toggle(event)
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  min-height: 100%;
  height: 100vh;
  height: 100dvh;
  /* Avoid content under system bars when layout spans full viewport */
  padding-left: var(--vip-safe-left);
  padding-right: var(--vip-safe-right);
  box-sizing: border-box;
}

.sidebar {
  --sidebar-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --sidebar-duration: 0.32s;
  width: var(--vip-sidebar-width);
  background: transparent;
  border-right: none;
  box-shadow: var(--vip-shadow-sidebar);
  display: flex;
  flex-direction: column;
  padding: calc(0.3rem + var(--vip-safe-top)) 0.75rem calc(1.25rem + var(--vip-safe-bottom));
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 30;
  transition:
    width var(--sidebar-duration) var(--sidebar-ease),
    padding var(--sidebar-duration) var(--sidebar-ease),
    box-shadow var(--sidebar-duration) var(--sidebar-ease);

  &.collapsed {
    width: var(--vip-sidebar-collapsed);
    padding-left: 0.5rem;
    padding-right: 0.5rem;

    .sidebar-brand {
      justify-content: center;
      height: 7.5%;
      gap: 0;
    }

    .brand-text,
    .nav-label {
      max-width: 0;
      opacity: 0;
      margin: 0;
      transform: translateX(-6px);
    }

    .nav-item {
      justify-content: center;
      gap: 0;
      padding-left: 0.65rem;
      padding-right: 0.65rem;
    }
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.5rem;
  height: 7.5%;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  padding: 10px;
  transition:
    gap var(--sidebar-duration) var(--sidebar-ease),
    padding var(--sidebar-duration) var(--sidebar-ease),
    justify-content var(--sidebar-duration) var(--sidebar-ease);

  .brand-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .brand-text {
    font-weight: 700;
    font-size: 1.15rem;
    background: var(--vip-gradient-text);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    white-space: nowrap;
    overflow: hidden;
    max-width: 10rem;
    opacity: 1;
    transform: translateX(0);
    transition:
      max-width var(--sidebar-duration) var(--sidebar-ease),
      opacity 0.22s ease,
      transform var(--sidebar-duration) var(--sidebar-ease),
      margin var(--sidebar-duration) var(--sidebar-ease);
  }
}

.sidebar-brand-mobile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;

  .brand-icon {
    font-size: 1.5rem;
  }

  .brand-text {
    font-weight: 700;
    font-size: 1.15rem;
    background: var(--vip-gradient-text);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--vip-muted);
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  overflow: hidden;
  line-height: 20px;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    gap var(--sidebar-duration) var(--sidebar-ease),
    padding var(--sidebar-duration) var(--sidebar-ease),
    justify-content var(--sidebar-duration) var(--sidebar-ease);

  i {
    font-size: 1.1rem;
    width: 1.25rem;
    text-align: center;
    flex-shrink: 0;
  }

  .nav-label {
    white-space: nowrap;
    overflow: hidden;
    max-width: 10rem;
    opacity: 1;
    transform: translateX(0);
    transition:
      max-width var(--sidebar-duration) var(--sidebar-ease),
      opacity 0.22s ease,
      transform var(--sidebar-duration) var(--sidebar-ease),
      margin var(--sidebar-duration) var(--sidebar-ease);
  }

  &:hover {
    background: var(--vip-gradient-nav-hover);
    color: var(--vip-accent-blue);
    box-shadow: var(--vip-shadow-1);
  }

  &.active {
    background: var(--vip-gradient-nav-active);
    color: var(--vip-accent-blue);
    font-weight: 600;
    box-shadow: var(--vip-shadow-2);
  }
}

.collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--vip-border);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 8px;
  cursor: pointer;
  color: var(--vip-accent-blue);
  box-shadow: var(--vip-shadow-1);
  transition: box-shadow 0.15s ease, background 0.15s ease;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
    box-shadow: var(--vip-shadow-2);
  }
}

.main-column {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  min-height: var(--vip-header-height);
  height: auto;
  background: transparent;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-topbar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--vip-safe-top) 1.25rem 0;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar-right {
  margin-left: auto;
}

.locale-select {
  min-width: 6.5rem;
  height: 2.25rem;
}

.locale-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.locale-flag {
  width: 1.25rem;
  height: 0.875rem;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: var(--vip-shadow-1);
  flex-shrink: 0;
}

.locale-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.network-tag {
  padding-inline: 0.55rem;
}

.network-status {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  line-height: 1;

  .pi-wifi {
    font-size: 0.95rem;
  }
}

.network-offline-mark {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1;
}

.profile-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--vip-border);
  border-radius: 999px;
  transition: box-shadow 0.15s ease;
  background: white;

  &:hover {
    box-shadow: var(--vip-shadow-1);
  }
}

.profile-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  text-align: left;

  strong {
    font-size: 0.875rem;
    color: var(--vip-text);
  }

  small {
    font-size: 0.75rem;
    color: var(--vip-muted);
  }
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.content-breadcrumb {
  flex-shrink: 0;
  margin-bottom: 1rem;
  border: 1px solid var(--vip-border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--vip-shadow-2), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.content-body {
  flex: 1;
  min-height: 0;
  min-width: 0;

  >* {
    height: 100%;
    min-height: 0;
  }
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.75rem 0;
  padding-bottom: calc(var(--vip-safe-bottom));
  box-sizing: border-box;
  color: var(--vip-muted);
  font-size: 0.85rem;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-logo {
  height: 1.75rem;
  width: auto;
  object-fit: contain;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.main-layout.mobile {
  .content {
    padding: 1rem;
  }

  .topbar {
    padding: var(--vip-safe-top) 0.75rem .3rem;
  }

  .topbar-right {
    gap: 0.5rem;
  }

  .locale-select {
    min-width: 5.5rem;
    width: auto;
  }

  .footer {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

.main-layout.tablet {
  .topbar {
    padding: var(--vip-safe-top) 1rem .3rem;
  }

  .locale-select {
    min-width: 9rem;
  }
}

.main-layout.web {
  .locale-select {
    min-width: 10rem;
  }
}

.drawer-nav {
  padding-top: 0.5rem;
}

.change-password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--vip-text);
  }
}
</style>
