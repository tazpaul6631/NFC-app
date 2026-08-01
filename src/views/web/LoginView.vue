<template>
  <div class="login-page web">
    <div class="login-glow" aria-hidden="true" />
    <Card class="login-card">
      <template #title>
        <div class="title-row">
          <i class="pi pi-shield login-brand-icon vip-brand-icon" />
          <span class="vip-gradient-text">{{ t('login.title') }}</span>
        </div>
      </template>
      <template #content>
        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="web-username">{{ t('common.username') }}</label>
            <IconField>
              <InputIcon class="pi pi-user" />
              <InputText id="web-username" v-model="username" class="w-full" autocomplete="username" />
            </IconField>
          </div>
          <div class="field">
            <label for="web-password">{{ t('common.password') }}</label>
            <Password input-id="web-password" v-model="password" class="w-full" input-class="w-full" :feedback="false"
              toggle-mask autocomplete="current-password" />
          </div>
          <Button type="submit" :label="t('login.submit')" icon="pi pi-sign-in" class="w-full" :loading="loading"
            size="large" />
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/store/auth'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('123456')
const loading = ref(false)

async function onSubmit() {
  if (!username.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: t('common.appName'),
      detail: 'Vui lòng nhập tài khoản / mật khẩu',
      life: 2500,
    })
    return
  }
  loading.value = true
  try {
    await authStore.login(username.value, password.value)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
@use '@/theme/login-shared.scss';
</style>

<style scoped lang="scss">
.login-page {
  position: relative;
  display: grid;
  place-items: center;
  padding: 2rem;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(48px);
    z-index: 0;
  }

  &::before {
    width: min(420px, 55vw);
    height: min(420px, 55vw);
    top: -8%;
    right: -6%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0) 72%);
  }

  &::after {
    width: min(360px, 48vw);
    height: min(360px, 48vw);
    bottom: -10%;
    left: -8%;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.26) 0%, rgba(37, 99, 235, 0) 70%);
  }
}

.login-glow {
  position: absolute;
  width: min(280px, 38vw);
  height: min(280px, 38vw);
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.14) 0%, transparent 68%);
  filter: blur(36px);
  pointer-events: none;
  z-index: 0;
}

.login-card {
  width: min(420px, 100%);
  position: relative;
  z-index: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;

  i {
    font-size: 1.4rem;
  }
}
</style>