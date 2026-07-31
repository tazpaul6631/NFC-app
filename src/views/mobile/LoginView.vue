<template>
  <div class="login-page mobile">
    <form class="login-sheet login-form" @submit.prevent="onSubmit">
      <div class="title-row">
        <i class="pi pi-shield login-brand-icon vip-brand-icon" />
        <span class="login-title vip-gradient-text">{{ t('login.title') }}</span>
      </div>
      <p class="login-hint">Mobile · {{ t('login.demoHint') }}</p>

      <div class="field">
        <label for="mobile-username">{{ t('common.username') }}</label>
        <InputText id="mobile-username" v-model="username" class="w-full" autocomplete="username" />
      </div>
      <div class="field">
        <label for="mobile-password">{{ t('common.password') }}</label>
        <Password input-id="mobile-password" v-model="password" class="w-full" input-class="w-full" :feedback="false"
          toggle-mask autocomplete="current-password" />
      </div>
      <Button type="submit" :label="t('login.submit')" icon="pi pi-sign-in" class="w-full" size="large"
        :loading="loading" />
    </form>
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
  display: grid;
  place-items: center;
  padding: 1.5rem 1rem;
}

.login-sheet {
  width: min(420px, 100%);
  padding: 1.5rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--vip-text);

  i {
    font-size: 1.4rem;
  }

  .login-title {
    font-size: 1.25rem;
  }
}
</style>
