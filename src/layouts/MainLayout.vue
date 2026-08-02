<template>
  <div class="main-layout">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-logo">
          <AppLogo size="3rem" />
        </div>

        <div class="topbar-right">
          <Tag :severity="authStore.isOnline ? 'success' : 'danger'" class="network-tag"
            :aria-label="authStore.isOnline ? t('common.online') : t('common.offline')">
            <span class="network-status">
              <i class="pi pi-wifi" />
              <span v-if="!authStore.isOnline" class="network-offline-mark">!</span>
            </span>
          </Tag>

          <Select v-model="locale" :options="localeOptions" option-label="label" option-value="value"
            class="locale-select" aria-label="Language" @change="applyLocale">
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
        </div>
      </div>
    </header>

    <main class="content">
      <div class="content-inner">
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
            <span>© 2026 By App Team</span>
          </div>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/auth'
import AppLogo from '@/components/AppLogo.vue'
import flagVi from '@/assets/images/flag-vi.png'
import flagEn from '@/assets/images/flag-en.png'
import flagZh from '@/assets/images/flag-zh-tw.png'
import logoCompany from '@/assets/images/logo-company.png'

const localeOptions = [
  { label: 'Tiếng Việt', value: 'vi', flag: flagVi },
  { label: 'English', value: 'en', flag: flagEn },
  { label: '繁體中文', value: 'zh', flag: flagZh },
]

const { t, locale } = useI18n()
const authStore = useAuthStore()

function getLocaleOption(value: string) {
  return localeOptions.find((option) => option.value === value) || null
}

function applyLocale() {
  localStorage.setItem('vip_locale', String(locale.value))
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 100vh;
  height: 100dvh;
  padding-left: var(--vip-safe-left);
  padding-right: var(--vip-safe-right);
  box-sizing: border-box;
}

.topbar {
  min-height: var(--vip-header-height);
  height: auto;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-topbar);
  padding: calc(0.4rem + var(--vip-safe-top)) 0.9rem 0.5rem;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar-inner {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.topbar-logo {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(191, 212, 70, 0.22);
  box-shadow: inset 0 0 0 1px rgb(214, 178, 101);
  overflow: hidden;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.locale-select {
  min-width: 5.5rem;
  width: auto;
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

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-inner {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 1rem 0.9rem 0;
  box-sizing: border-box;
}

.content-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;

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
  border-top: 1px solid var(--vip-border);
  margin-top: 0.75rem;
  padding: 0.75rem 0;
  padding-bottom: calc(0.75rem + var(--vip-safe-bottom));
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
</style>
