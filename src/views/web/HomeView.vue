<template>
  <div class="home web page-scroll-container">
    <div class="page-header">
      <div>
        <h1>{{ t('home.title') }}</h1>
        <p>{{ t('home.subtitle') }} · Web layout</p>
      </div>
      <Button label="Refresh" icon="pi pi-refresh" outlined @click="refresh" />
    </div>

    <div class="stats">
      <Card v-for="item in stats" :key="item.label" class="stat-card">
        <template #content>
          <div class="stat-body">
            <i :class="item.icon" />
            <div class="stat-content">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>Recent activity</template>
      <template #content>
        <DataTable :value="rows" striped-rows size="small">
          <Column field="time" header="Time" />
          <Column field="action" header="Action" />
          <Column field="user" header="User" />
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="data.status === 'OK' ? 'success' : 'warn'" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const { t } = useI18n()

const stats = ref([
  { label: 'Users', value: '128', icon: 'pi pi-users' },
  { label: 'Orders', value: '42', icon: 'pi pi-shopping-cart' },
  { label: 'Alerts', value: '3', icon: 'pi pi-bell' },
  { label: 'Uptime', value: '99.9%', icon: 'pi pi-chart-line' },
])

const rows = ref([
  { time: dayjs().subtract(5, 'minute').format('HH:mm'), action: 'Login', user: 'admin', status: 'OK' },
  { time: dayjs().subtract(20, 'minute').format('HH:mm'), action: 'Sync data', user: 'system', status: 'OK' },
  { time: dayjs().subtract(1, 'hour').format('HH:mm'), action: 'Export report', user: 'admin', status: 'Pending' },
])

function refresh() {
  rows.value = [
    { time: dayjs().format('HH:mm'), action: 'Manual refresh', user: 'admin', status: 'OK' },
    ...rows.value,
  ].slice(0, 5)
}
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
  }

  p {
    margin: 0;
    color: var(--vip-muted);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 1rem;

  .stat-content {
    display: flex;
    align-items: center;
    gap: var(--p-card-body-gap);
  }

  i {
    font-size: 1.5rem;
  }
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
}

.stat-label {
  color: var(--vip-muted);
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
