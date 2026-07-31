<template>
  <div class="home mobile page-scroll-container">
    <h1>{{ t('home.title') }}</h1>
    <p class="subtitle">{{ t('home.subtitle') }} · Mobile</p>

    <div class="quick-actions">
      <Button v-for="a in actions" :key="a.label" :icon="a.icon" :label="a.label" outlined class="action"
        @click="a.onClick" />
    </div>

    <Card class="mt-3">
      <template #title>Today</template>
      <template #content>
        <ul class="list">
          <li v-for="row in rows" :key="row.id">
            <div>
              <strong>{{ row.title }}</strong>
              <small>{{ row.time }}</small>
            </div>
            <Tag :value="row.status" severity="info" />
          </li>
        </ul>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const { t } = useI18n()
const router = useRouter()

const actions = [
  { label: 'Home', icon: 'pi pi-home', onClick: () => router.push('/home') },
  { label: 'Settings', icon: 'pi pi-cog', onClick: () => router.push('/settings') },
]

const rows = ref([
  { id: 1, title: 'Sync completed', time: dayjs().format('HH:mm'), status: 'Done' },
  { id: 2, title: 'New notification', time: dayjs().subtract(10, 'm').format('HH:mm'), status: 'New' },
])
</script>

<style scoped lang="scss">
h1 {
  margin: 0;
  font-size: 1.4rem;
}

.subtitle {
  margin: 0.25rem 0 1rem;
  color: var(--vip-muted);
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--vip-border);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    strong {
      display: block;
    }

    small {
      color: var(--vip-muted);
    }
  }
}
</style>
