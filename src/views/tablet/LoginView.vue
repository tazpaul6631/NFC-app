<template>
  <div class="login-page tablet">
    <Card class="login-card">
      <template #title>
        <div class="title-row">
          <i class="pi pi-shield login-brand-icon vip-brand-icon" />
          <span class="vip-gradient-text">{{ t('login.title') }}</span>
        </div>
      </template>
      <template #subtitle>
        <span class="login-hint">Tablet · {{ t('login.demoHint') }}</span>
      </template>
      <template #content>
        <form class="login-form" @submit.prevent="onSubmit">
          <div class="field">
            <label for="tablet-username">{{ t('common.username') }}</label>
            <InputText id="tablet-username" v-model="username" class="w-full" autocomplete="username" />
          </div>
          <div class="field">
            <label for="tablet-password">{{ t('common.password') }}</label>
            <Password input-id="tablet-password" v-model="password" class="w-full" input-class="w-full"
              :feedback="false" toggle-mask autocomplete="current-password" />
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
  display: grid;
  place-items: center;
  padding: 2rem;
}

.login-card {
  width: min(480px, 100%);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--vip-text);

  i {
    font-size: 1.4rem;
  }
}
</style>
