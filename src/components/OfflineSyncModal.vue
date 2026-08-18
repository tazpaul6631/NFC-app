<template>
  <Dialog :visible="visible" modal :header="t('checkin.sync.title')" :style="{ width: 'min(440px, 94vw)' }"
    :draggable="false" :closable="false" @update:visible="onVisibleUpdate">
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
        <div v-for="group in groupedOfflinePending" :key="group.plateKey" class="plate-group">
          <div class="plate-group-header">
            <span class="plate-group-label">
              {{ t('checkin.nfc.plateLabel') }}:
              <strong>{{ group.plateLabel }}</strong>
            </span>
            <span class="plate-group-count">({{ group.employees.length }})</span>
          </div>

          <div v-for="emp in group.employees" :key="emp.id" class="employee-row checked">
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
        </div>
      </div>
    </div>

    <template #footer>
      <Button :label="t('common.cancel')" severity="secondary" size="large" @click="close" />
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
import type { CheckedInEmployee } from '@/store/checkinList'
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

function onVisibleUpdate(v: boolean) {
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
  emp: { name: string; code: string; cardNumber: string; numberPlate?: string },
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [emp.name, emp.code, emp.cardNumber, emp.numberPlate].some((v) =>
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

/** Gom theo biển số — thứ tự nhóm theo lần xuất hiện đầu (mới hơn thường ở đầu queue) */
const groupedOfflinePending = computed(() => {
  const map = new Map<string, CheckedInEmployee[]>()
  for (const emp of filteredOfflinePendingEmployees.value) {
    const key = (emp.numberPlate || '').trim() || '__unknown__'
    const list = map.get(key)
    if (list) list.push(emp)
    else map.set(key, [emp])
  }
  return [...map.entries()].map(([plateKey, employees]) => ({
    plateKey,
    plateLabel:
      plateKey === '__unknown__' ? String(t('checkin.sync.unknownPlate')) : plateKey,
    employees,
  }))
})

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
  gap: 0.85rem;
}

.plate-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.plate-group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.15rem 0.25rem;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--p-dialog-background, var(--p-content-background, #fff));
}

.plate-group-label {
  font-size: 0.82rem;
  color: var(--vip-muted);

  strong {
    color: var(--vip-text, inherit);
    font-size: 0.95rem;
  }
}

.plate-group-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vip-accent-green, #10b981);
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
