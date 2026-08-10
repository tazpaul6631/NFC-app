<template>
  <Dialog :visible="visible" modal :header="t('checkin.sync.title')" :style="{ width: 'min(440px, 94vw)' }"
    :draggable="false" :closable="canClose" @update:visible="onVisibleUpdate">
    <div class="list-modal-body">
      <p v-if="offlinePendingCount" class="sync-subtitle">
        {{
          isReminder
            ? t('checkin.kick.reminderModalText', { count: offlinePendingCount })
            : t('checkin.sync.subtitle', { count: offlinePendingCount })
        }}
      </p>
      <p v-else class="sync-subtitle">{{ t('checkin.sync.empty') }}</p>

      <IconField v-if="offlinePendingEmployees.length" class="scanned-list-filter-wrap sync-list-filter">
        <InputText v-model="filterOfflineEmployee" class="scanned-list-filter" :placeholder="t('common.search')" />
        <InputIcon v-show="!!filterOfflineEmployee" class="pi pi-times clear-filter-icon" role="button" tabindex="0"
          :aria-label="t('common.cancel')" @click="filterOfflineEmployee = ''"
          @keydown.enter.prevent="filterOfflineEmployee = ''" />
      </IconField>

      <div class="employee-list modal-employee-list">
        <div v-for="emp in filteredOfflinePendingEmployees" :key="emp.id" class="employee-row checked">
          <div class="recent-avatar-wrap">
            <Avatar :label="emp.initials" shape="circle" :style="{
              backgroundColor: emp.color,
              color: 'white',
              fontWeight: 'bold',
              boxShadow: 'var(--vip-shadow-primary)',
            }" />
            <i class="pi pi-cloud-upload pending-cloud" :title="t('checkin.sync.pendingTag')"
              :aria-label="t('checkin.sync.pendingTag')" />
          </div>
          <div class="employee-info">
            <strong>{{ emp.name ? emp.name : '...' }}</strong>
            <small>Id: {{ emp.code ? emp.code : '...' }}</small>
            <small>Card: {{ emp.cardNumber ? emp.cardNumber : '...' }}</small>
          </div>
          <div class="employee-status">
            <span class="employee-time">{{ emp.checkinTime }}</span>
            <span class="status-badge pending">{{ t('checkin.sync.pendingTag') }}</span>
          </div>
        </div>

        <p v-if="!filteredOfflinePendingEmployees.length" class="empty-hint">
          {{ t('checkin.nfc.filterEmpty') }}
        </p>
      </div>
    </div>

    <template #footer>
      <Button v-if="canClose" :label="t('common.cancel')" severity="secondary" size="large" @click="close" />
      <Button :label="t('checkin.sync.syncButton')" icon="pi pi-sync" :loading="syncing"
        :disabled="!offlinePendingCount || !authStore.isOnline" size="large" @click="onSync" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import { useCheckinListStore } from '@/store/checkinList'
import { useAuthStore } from '@/store/auth'
import { isOfflineSyncing, syncOfflineQueue } from '@/services/offlineSyncService'

const props = withDefaults(
  defineProps<{
    /** Modal thủ công (v-model) — không truyền = dùng reminderModalVisible từ store */
    modelValue?: boolean
    isReminder?: boolean
  }>(),
  {
    modelValue: undefined,
    isReminder: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const checkinListStore = useCheckinListStore()
const { offlinePendingEmployees, offlinePendingCount, reminderModalVisible } =
  storeToRefs(checkinListStore)

const filterOfflineEmployee = ref('')
const syncing = ref(false)

const isReminder = computed(() => props.isReminder)

const visible = computed(() =>
  isReminder.value ? reminderModalVisible.value : Boolean(props.modelValue),
)

/** Reminder: không đóng khi còn pending */
const canClose = computed(() => !isReminder.value || offlinePendingCount.value === 0)

function onVisibleUpdate(v: boolean) {
  if (!v && !canClose.value) return
  if (isReminder.value) {
    if (!v) checkinListStore.closeReminderModal()
  } else {
    emit('update:modelValue', v)
  }
}

function close() {
  onVisibleUpdate(false)
}

function matchesEmployeeFilter(
  emp: { name: string; code: string; cardNumber: string },
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [emp.name, emp.code, emp.cardNumber].some((v) =>
    String(v || '')
      .toLowerCase()
      .includes(q),
  )
}

const filteredOfflinePendingEmployees = computed(() =>
  offlinePendingEmployees.value.filter((emp) =>
    matchesEmployeeFilter(emp, filterOfflineEmployee.value),
  ),
)

watch(offlinePendingCount, (count) => {
  if (count === 0 && isReminder.value) {
    checkinListStore.closeReminderModal()
  }
})

async function onSync() {
  if (syncing.value || isOfflineSyncing()) return
  syncing.value = true
  try {
    const ok = await syncOfflineQueue({ silent: false })
    if (ok && !offlinePendingCount.value) {
      onVisibleUpdate(false)
    }
  } finally {
    syncing.value = false
  }
}
</script>

<style scoped lang="scss">
.list-modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.sync-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vip-muted);
}

.scanned-list-filter,
.sync-list-filter {
  width: 100%;
}

.scanned-list-filter-wrap {
  width: 100%;
}

.clear-filter-icon {
  cursor: pointer;
}

.modal-employee-list {
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.employee-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
}

.recent-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.pending-cloud {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  color: #fff;
  background: #d97706;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;

  strong {
    font-size: 0.88rem;
  }

  small {
    color: var(--vip-muted);
    font-size: 0.75rem;
  }
}

.employee-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
}

.employee-time {
  font-size: 0.78rem;
  color: var(--vip-accent-green);
  font-weight: 600;
}

.status-badge.pending {
  font-size: 0.7rem;
  color: #d97706;
  font-weight: 600;
}

.empty-hint {
  text-align: center;
  color: var(--vip-muted);
  font-size: 0.85rem;
  padding: 1rem 0;
}
</style>
