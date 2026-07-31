<template>
  <div class="home tablet page-scroll-container">
    <div class="page-header">
      <div>
        <h1>{{ t('home.title') }}</h1>
        <p>{{ t('home.subtitle') }} · Tablet layout</p>
      </div>
    </div>

    <div class="tablet-grid">
      <Card v-for="item in cards" :key="item.title" class="tile">
        <template #title>
          <div class="tile-title">
            <i :class="item.icon" />
            <span>{{ item.title }}</span>
          </div>
        </template>
        <template #content>
          <p>{{ item.desc }}</p>
          <Button :label="item.action" size="small" @click="item.onClick" />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const cards = [
  {
    title: 'Dashboard',
    desc: 'Tổng quan hoạt động trên tablet.',
    icon: 'pi pi-th-large',
    action: 'Open',
    onClick: () => router.push('/home'),
  },
  {
    title: 'Settings',
    desc: 'Cấu hình ngôn ngữ và tài khoản.',
    icon: 'pi pi-cog',
    action: 'Configure',
    onClick: () => router.push('/settings'),
  },
  {
    title: 'Scan',
    desc: 'Sẵn sàng gắn barcode / camera Capacitor.',
    icon: 'pi pi-qrcode',
    action: 'Soon',
    onClick: () => undefined,
  },
  {
    title: 'Sync',
    desc: 'Đồng bộ offline với SQLite / Preferences.',
    icon: 'pi pi-sync',
    action: 'Soon',
    onClick: () => undefined,
  },
]
</script>

<style scoped lang="scss">
.page-header {
  margin-bottom: 1.25rem;

  h1 {
    margin: 0 0 0.25rem;
  }

  p {
    margin: 0;
    color: var(--vip-muted);
  }
}

.tablet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.tile-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tile p {
  color: var(--vip-muted);
  min-height: 3rem;
}
</style>
