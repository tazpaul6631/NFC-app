<template>
  <div class="checkin-flow mobile page-scroll-container">
    <div class="ck-header">
      <div class="ck-header-text">
        <strong>{{ t('checkin.header.title') }}</strong>
      </div>

      <div class="ck-step-indicator">
        <template v-for="(step, idx) in stepIndicatorList" :key="step.value">
          <div class="ck-step-item" :class="step.status">
            <span class="ck-step-dot" :class="step.status">
              <i :class="step.icon" />
            </span>
            <span class="ck-step-label">{{ t(step.labelKey) }}</span>
          </div>
          <span v-if="idx < stepIndicatorList.length - 1" class="ck-step-line" :class="step.status" />
        </template>
      </div>
    </div>

    <Stepper v-model:value="activeStep" class="ck-stepper">
      <div class="ck-content">
        <LottieLoader :visible="transitioning" :message="loadingMessage" />

        <StepPanels>
          <StepPanel value="1">
            <div class="ck-panel scan-step">
              <h2>{{ t('checkin.scan.title') }}</h2>
              <p class="ck-subtitle">{{ t('checkin.scan.subtitle') }}</p>

              <div class="scan-card" :class="{ done: vehicleConfirmed }">
                <div class="scan-icon-container">
                  <div class="scan-icon">
                    <i
                      :class="vehicleConfirmed ? 'pi pi-check-circle' : authStore.isOnline ? 'pi pi-qrcode' : 'pi pi-list'" />
                  </div>
                  <div class="scan-info">
                    <strong>{{
                      vehicleConfirmed
                        ? t('checkin.scan.doneLabel')
                        : authStore.isOnline
                          ? t('checkin.scan.hint')
                          : t('checkin.scan.selectPlateHint')
                    }}</strong>
                  </div>
                </div>

                <Select v-if="!vehicleConfirmed && !authStore.isOnline" v-model="selectedPlate"
                  :options="offlineVehicleOptions" option-label="label" option-value="value"
                  :placeholder="t('checkin.scan.selectPlatePlaceholder')" class="w-full offline-plate-select"
                  size="large" @update:model-value="onOfflinePlateSelect" filter />

                <Button v-if="!vehicleConfirmed && authStore.isOnline" :label="t('checkin.scan.scanButton')"
                  icon="pi pi-qrcode" size="large" :loading="scanning" @click="handleScanClick" />
              </div>

              <div v-if="!vehicleConfirmed && authStore.isOnline" class="scan-secondary-actions">
                <Button v-if="qrErrorCode === 'CAMERA_PERMISSION_DENIED'" :label="t('checkin.scan.openSettings')"
                  icon="pi pi-cog" text size="large" @click="openCameraSettings" />
              </div>

              <Transition name="fade">
                <div v-if="vehicleConfirmed" class="vehicle-card">
                  <span class="plate-tag">{{ vehicle.plate }}</span>
                </div>
              </Transition>

              <Button v-if="vehicleConfirmed" :label="t('checkin.scan.confirmButton')" icon="pi pi-arrow-right"
                icon-pos="right" class="w-full" size="large" @click="goNext" />
            </div>
          </StepPanel>

          <StepPanel value="2">
            <div class="ck-panel nfc-step">
              <div class="nfc-connect-card" :class="nfcUiState">
                <div class="nfc-plate-side">
                  <div class="nfc-plate-row">
                    <div class="nfc-plate-text">
                      <span class="nfc-plate-label">{{ t('checkin.nfc.plateLabel') }}</span>
                      <span class="plate-tag compact">{{ vehicle.plate }}</span>
                    </div>
                    <div class="nfc-action-btns">
                      <span class="chip-btn-wrap">
                        <Button class="nfc-list-btn" icon="pi pi-cloud-upload" severity="warn" outlined size="large"
                          :aria-label="t('checkin.sync.open')" :title="t('checkin.sync.open')"
                          @click="syncModalVisible = true" />
                        <span v-if="offlinePendingCount > 0" class="chip-note warn">{{ offlinePendingCount }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="nfc-status-side">
                  <button type="button" class="nfc-pad" :class="nfcUiState" :disabled="allCheckedIn || nfcConnecting"
                    :aria-label="nfcStatusText" @click="onNfcPadClick">
                    <span v-if="nfcConnected" class="nfc-ring r1" />
                    <span v-if="nfcConnected" class="nfc-ring r2" />
                    <i :class="nfcPadIcon" />
                  </button>
                  <div class="nfc-status-meta">
                    <Tag :value="nfcStatusText" :severity="nfcStatusSeverity" class="nfc-status-tag" />
                    <small class="nfc-hint">{{ nfcHintText }}</small>
                  </div>
                </div>
              </div>

              <div class="scanned-list-block">
                <div class="scanned-list-head">
                  <span class="recent-title">{{ t('checkin.nfc.recent') }}</span>
                  <strong class="scanned-count">{{ checkedInCount }}/{{ employees.length }}</strong>
                </div>

                <div class="scanned-list">
                  <TransitionGroup name="recent-row">
                    <div v-for="emp in scannedEmployees" :key="emp.id" class="recent-row">
                      <Avatar :label="emp.initials" shape="circle" :style="{ backgroundColor: emp.color }" />
                      <span class="recent-name">{{ emp.name }}</span>
                      <span class="recent-time">{{ emp.checkinTime }}</span>
                    </div>
                  </TransitionGroup>

                  <p v-if="!scannedEmployees.length" class="empty-hint">{{ t('checkin.nfc.emptyList') }}</p>
                </div>
              </div>
            </div>
          </StepPanel>
        </StepPanels>
      </div>
    </Stepper>

    <Dialog v-model:visible="completeConfirmVisible" modal :header="t('checkin.nfc.completeConfirmTitle')"
      :style="{ width: 'min(400px, 94vw)' }" :draggable="false" :closable="false">
      <p class="sync-subtitle">
        {{ t('checkin.nfc.completeConfirmMessage', { boarded: checkedInCount, total: employees.length }) }}
      </p>
      <template #footer>
        <Button :label="t('common.cancel')" severity="secondary" @click="completeConfirmVisible = false" size="large" />
        <Button :label="t('checkin.nfc.completeConfirmButton')" icon="pi pi-check" @click="confirmCompleteTrip"
          size="large" />
      </template>
    </Dialog>

    <Dialog v-model:visible="syncModalVisible" modal :header="t('checkin.sync.title')"
      :style="{ width: 'min(440px, 94vw)' }" :draggable="false" :closable="false">
      <div class="list-modal-body">
        <p class="sync-subtitle">
          {{
            offlinePendingCount
              ? t('checkin.sync.subtitle', { count: offlinePendingCount })
              : t('checkin.sync.empty')
          }}
        </p>

        <div class="employee-list modal-employee-list">
          <div v-for="emp in offlinePendingEmployees" :key="emp.id" class="employee-row checked">
            <Avatar :label="emp.initials" shape="circle" :style="{ backgroundColor: emp.color }" />
            <div class="employee-info">
              <strong>{{ emp.name }}</strong>
              <small>{{ emp.code }} · {{ emp.checkinTime }}</small>
            </div>
            <div class="employee-status">
              <span class="status-badge pending">{{ t('checkin.sync.pendingTag') }}</span>
            </div>
          </div>

          <p v-if="!offlinePendingEmployees.length" class="empty-hint">{{ t('checkin.sync.empty') }}</p>
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" severity="secondary" @click="syncModalVisible = false" size="large" />
        <Button :label="t('checkin.sync.syncButton')" icon="pi pi-sync" :loading="syncing"
          :disabled="!offlinePendingCount" @click="syncOfflineData" size="large" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import Stepper from 'primevue/stepper'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import Dialog from 'primevue/dialog'
import LottieLoader from '@/components/LottieLoader.vue'
import { useQrScan } from '@/composables/useQrScan'
import { useNfcScan } from '@/composables/useNfcScan'
import { useCheckinStepStore } from '@/store/checkinStep'
import { useAuthStore } from '@/store/auth'

interface Employee {
  id: number
  name: string
  code: string
  dept: string
  checkedIn: boolean
  checkinTime: string | null
  initials: string
  color: string
  /** Chưa đồng bộ lên server (offline queue) */
  pendingSync: boolean
}

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const checkinStepStore = useCheckinStepStore()
const { activeStep } = storeToRefs(checkinStepStore)
const completedSteps = reactive(new Set<'1' | '2'>())
const transitioning = ref(false)
const loadingMessage = ref('')
const syncModalVisible = ref(false)
const syncing = ref(false)
const completeConfirmVisible = ref(false)

function flashLoader(message: string, ms = 650) {
  loadingMessage.value = message
  transitioning.value = true
  setTimeout(() => {
    transitioning.value = false
  }, ms)
}

function goNext() {
  completedSteps.add(activeStep.value)
  checkinStepStore.next('2')
  flashLoader(t('checkin.loading.default'))
}

/* ---------- Step 1: scan ---------- */
const scanning = ref(false)
const vehicleConfirmed = ref(false)
const tripCompleted = ref(false)
const selectedPlate = ref<string | null>(null)

/** Demo danh sách biển số cache offline — sau thay bằng data local */
const offlineVehicleOptions = [
  { label: '51B-223.45', value: '51B-223.45' },
  { label: '51B-118.90', value: '51B-118.90' },
  { label: '51B-334.12', value: '51B-334.12' },
]

const vehicle = reactive({
  plate: '',
  routeCode: 'Tuyến 04',
  from: 'Long An',
  to: 'KCN',
  driver: 'Nguyễn Văn Sáng',
  capacity: 29,
  departure: '06:42',
  eta: '07:15',
})

function onOfflinePlateSelect(plate: string | null) {
  if (!plate || vehicleConfirmed.value) return
  vehicle.plate = plate
  vehicleConfirmed.value = true
  flashLoader(t('checkin.loading.scan'), 400)
}

function simulateScan() {
  if (vehicleConfirmed.value || scanning.value) return
  scanning.value = true
  flashLoader(t('checkin.loading.scan'), 1100)
  setTimeout(() => {
    scanning.value = false
    vehicle.plate = vehicle.plate || '51B-223.45'
    vehicleConfirmed.value = true
  }, 1100)
}

const {
  isNative: isNativeScan,
  scanOnce,
  errorCode: qrErrorCode,
  openSettings: openCameraSettings,
} = useQrScan()

// function resolveQrErrorMessage(code: string) {
//   const key = `checkin.scan.errors.${code}`
//   const translated = t(key)
//   return translated === key ? t('checkin.scan.errors.GENERIC') : translated
// }

async function handleScanClick() {
  if (vehicleConfirmed.value || scanning.value) return

  if (!isNativeScan) {
    simulateScan()
    return
  }

  scanning.value = true
  flashLoader(t('checkin.loading.scan'))
  try {
    const value = await scanOnce()
    if (value) {
      vehicle.plate = value
      vehicleConfirmed.value = true
    }
    // else if (qrErrorCode.value) {
    //   toast.add({
    //     severity: 'warn',
    //     summary: t('checkin.scan.title'),
    //     detail: resolveQrErrorMessage(qrErrorCode.value),
    //     life: 3200,
    //   })
    // }
  } finally {
    scanning.value = false
  }
}

/* ---------- Step 2: NFC ---------- */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(-2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

const avatarColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6']

function makeEmployee(
  id: number,
  name: string,
  code: string,
  dept: string,
  checkedIn: boolean,
  checkinTime: string | null,
  pendingSync = false,
): Employee {
  return {
    id,
    name,
    code,
    dept,
    checkedIn,
    checkinTime,
    initials: getInitials(name),
    color: avatarColors[id % avatarColors.length],
    pendingSync,
  }
}

const employees = reactive<Employee[]>([
  makeEmployee(1, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(2, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(3, 'Lê Hoàng Phúc', 'NV0312', 'Xưởng lắp ráp 2', true, '09:59:57', false),
  makeEmployee(4, 'Phạm Thị Ngọc Anh', 'NV0087', 'Kho vận', true, '09:59:59', false),
  makeEmployee(5, 'Đỗ Minh Tuấn', 'NV0155', 'Bảo trì thiết bị', true, '10:00:01', false),
  makeEmployee(6, 'Vũ Thị Ánh', 'NV0259', 'Bảo trì thiết bị', true, '10:00:02', false),
  makeEmployee(7, 'Bùi Văn Long', 'NV0221', 'Kho vận', false, null),
  makeEmployee(8, 'Hoàng Thị Lan', 'NV0203', 'Kiểm định chất lượng', false, null),
  makeEmployee(9, 'Ngô Đức Thắng', 'NV0176', 'Xưởng lắp ráp 1', false, null),
  makeEmployee(10, 'Trịnh Thị Kim Oanh', 'NV0142', 'Nhân sự', false, null),
  makeEmployee(11, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(12, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(13, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(14, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(15, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(16, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(17, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(18, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(19, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(20, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(21, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(22, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(23, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(24, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(25, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(26, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
  makeEmployee(27, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54', true),
  makeEmployee(28, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56', true),
])

const checkedInCount = computed(() => employees.filter((e) => e.checkedIn).length)
const allCheckedIn = computed(() => checkedInCount.value === employees.length)
const offlinePendingEmployees = computed(() =>
  employees
    .filter((e) => e.checkedIn && e.pendingSync)
    .sort((a, b) => (b.checkinTime! > a.checkinTime! ? 1 : -1)),
)
const offlinePendingCount = computed(() => offlinePendingEmployees.value.length)

function isStepDone(value: '1' | '2') {
  return completedSteps.has(value)
}

const STEP_ICONS: Record<'1' | '2', string> = {
  '1': 'pi pi-qrcode',
  '2': 'pi pi-wifi',
}

const STEP_LABEL_KEYS: Record<'1' | '2', string> = {
  '1': 'checkin.tabs.scan',
  '2': 'checkin.tabs.nfc',
}

const stepIndicatorList = computed(() =>
  (['1', '2'] as const).map((value) => {
    const done = isStepDone(value)
    const status: 'pending' | 'current' | 'success' = done
      ? 'success'
      : activeStep.value === value
        ? 'current'
        : 'pending'
    return {
      value,
      status,
      labelKey: STEP_LABEL_KEYS[value],
      icon: STEP_ICONS[value],
    }
  }),
)

/** Toàn bộ nhân viên đã điểm danh (mới nhất trước), hiển thị trong list scroll riêng của step 2. */
const scannedEmployees = computed(() =>
  employees
    .filter((e) => e.checkedIn && e.checkinTime)
    .sort((a, b) => (b.checkinTime! > a.checkinTime! ? 1 : -1)),
)

const nfcConnecting = ref(false)

function recordNfcCheckin(_code?: string | null) {
  const next = employees.find((e) => !e.checkedIn)
  if (!next) return
  flashLoader(t('checkin.loading.nfc'), 350)
  setTimeout(() => {
    next.checkedIn = true
    next.checkinTime = dayjs().format('HH:mm:ss')
    // Offline hoặc mất mạng → xếp hàng chờ sync
    next.pendingSync = !authStore.isOnline
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.title'),
      detail: `${next.name} — ${t('checkin.list.checkedTag')}`,
      life: 1800,
    })
  }, 350)
}

async function syncOfflineData() {
  if (!offlinePendingCount.value || syncing.value) return
  syncing.value = true
  flashLoader(t('checkin.sync.syncing'), 900)
  try {
    await new Promise((r) => setTimeout(r, 900))
    const pending = employees.filter((e) => e.checkedIn && e.pendingSync)
    pending.forEach((emp) => {
      emp.pendingSync = false
    })
    toast.add({
      severity: 'success',
      summary: t('checkin.sync.title'),
      detail: t('checkin.sync.successToast'),
      life: 2200,
    })
    syncModalVisible.value = false
  } finally {
    syncing.value = false
  }
}

const {
  isNative: isNativeNfc,
  isConnected: nfcConnected,
  nfcStatus,
  statusLabel: nfcStatusLabel,
  errorMessage: nfcError,
  refreshStatus: refreshNfcStatus,
  startScan: startNfcScan,
  stopScan: stopNfcScan,
  openNfcSettings,
} = useNfcScan({
  allowWebMock: true,
  onCard: (card) => {
    recordNfcCheckin(card.cardNumber ?? card.uid)
  },
  onConnectionLost: (reason) => {
    const detail =
      reason === 'NFC_UNSUPPORTED'
        ? t('checkin.nfc.errors.NFC_UNSUPPORTED')
        : t('checkin.nfc.toastReconnect')
    toast.add({
      severity: 'warn',
      summary: t('checkin.nfc.title'),
      detail,
      life: 3500,
    })
  },
})

const nfcUiState = computed(() => {
  if (allCheckedIn.value) return 'done'
  if (nfcConnecting.value) return 'connecting'
  if (nfcConnected.value) return 'connected'
  if (nfcStatus.value === 'NFC_DISABLED') return 'disabled'
  if (nfcStatusLabel.value === 'unsupported') return 'unsupported'
  return 'idle'
})

const nfcStatusSeverity = computed(() => {
  switch (nfcUiState.value) {
    case 'connected':
      return 'success'
    case 'connecting':
      return 'info'
    case 'done':
      return 'success'
    case 'disabled':
    case 'unsupported':
      return 'warn'
    default:
      return 'warn'
  }
})

const nfcStatusText = computed(() => {
  switch (nfcUiState.value) {
    case 'connected':
      return t('checkin.nfc.status.connected')
    case 'connecting':
      return t('checkin.nfc.status.connecting')
    case 'done':
      return t('checkin.nfc.status.done')
    case 'disabled':
      return t('checkin.nfc.status.disabled')
    case 'unsupported':
      return t('checkin.nfc.status.unsupported')
    default:
      return t('checkin.nfc.status.idle')
  }
})

const nfcHintText = computed(() => {
  if (allCheckedIn.value) return t('checkin.nfc.allDone')
  if (nfcConnected.value) return t('checkin.nfc.prompt')
  if (nfcStatus.value === 'NFC_DISABLED') return t('checkin.nfc.hintDisabled')
  if (nfcStatusLabel.value === 'unsupported' && isNativeNfc) return t('checkin.nfc.hintUnsupported')
  return t('checkin.nfc.hintConnect')
})

const nfcPadIcon = computed(() => {
  if (nfcConnecting.value) return 'pi pi-spin pi-spinner'
  if (nfcConnected.value || allCheckedIn.value) return 'pi pi-wifi'
  if (nfcStatus.value === 'NFC_DISABLED') return 'pi pi-ban'
  return 'pi pi-link'
})

async function connectNfc() {
  if (nfcConnected.value || nfcConnecting.value || allCheckedIn.value) return

  nfcConnecting.value = true
  try {
    await refreshNfcStatus()

    if (isNativeNfc && nfcStatus.value === 'NFC_DISABLED') {
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.title'),
        detail: t('checkin.nfc.toastEnableNfc'),
        life: 3200,
      })
      await openNfcSettings()
      return
    }

    if (isNativeNfc && (nfcStatusLabel.value === 'unsupported' || nfcStatus.value === 'NO_NFC')) {
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.title'),
        detail: t('checkin.nfc.errors.NFC_UNSUPPORTED'),
        life: 3200,
      })
      return
    }

    await startNfcScan()

    if (nfcConnected.value) {
      toast.add({
        severity: 'success',
        summary: t('checkin.nfc.title'),
        detail: t('checkin.nfc.toastConnected'),
        life: 2200,
      })
    } else if (nfcError.value) {
      const key = `checkin.nfc.errors.${nfcError.value}`
      const detail = t(key) === key ? nfcError.value : t(key)
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.title'),
        detail,
        life: 3200,
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('checkin.nfc.title'),
      detail: err instanceof Error ? err.message : t('checkin.nfc.errors.GENERIC'),
      life: 3200,
    })
  } finally {
    nfcConnecting.value = false
  }
}

async function onNfcPadClick() {
  if (allCheckedIn.value) return

  if (!nfcConnected.value) {
    await connectNfc()
    return
  }

  // Đã kết nối: trên web tap để demo; trên máy thật chờ chạm thẻ
  if (!isNativeNfc) {
    recordNfcCheckin()
  }
}

watch(activeStep, async (step, prev) => {
  if (step === '2') {
    await refreshNfcStatus()
  } else if (prev === '2') {
    await stopNfcScan()
  }
})

onUnmounted(() => {
  void stopNfcScan()
})

function completeTrip() {
  completedSteps.add('2')
  tripCompleted.value = true
}

function confirmCompleteTrip() {
  completeConfirmVisible.value = false
  completeTrip()
  toast.add({
    severity: 'success',
    summary: t('checkin.nfc.completeTrip'),
    detail: t('checkin.nfc.completeSuccessToast'),
    life: 2500,
  })
}
</script>

<style scoped lang="scss">
.checkin-flow {
  display: flex;
  flex-direction: column;
}

/* ---------- Header ---------- */
.ck-header {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-bottom: 0.3rem;
  padding: 3px;
}

.ck-header-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--vip-gradient-primary);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  padding: 0.85rem 1rem;
  color: #fff;
  box-shadow: var(--vip-shadow-primary);

  strong {
    font-size: 0.98rem;
    line-height: 1.25;
  }
}

.ck-step-indicator {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  background: var(--vip-surface);
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow: var(--vip-shadow-primary);
}

.ck-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  gap: 0.3rem;
}

.ck-step-label {
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.15;
  text-align: center;
  color: var(--vip-muted);
  max-width: 4.4rem;
  transition: color 0.2s ease;

  &.pending {
    color: var(--vip-muted);
  }

  &.current {
    color: var(--vip-accent-amber);
    font-weight: 700;
    animation: ck-blink-warn 3s ease-in-out infinite;
  }

  &.success {
    color: var(--vip-accent-green);
  }
}

.ck-step-item.current .ck-step-label {
  color: var(--vip-accent-amber);
  font-weight: 700;
  animation: ck-blink-warn 3s ease-in-out infinite;
}

.ck-step-item.success .ck-step-label {
  color: var(--vip-accent-green);
}

.ck-step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  font-size: 0.85rem;
  color: #fff;
  border: 2px solid transparent;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--vip-shadow-primary);

  &.pending {
    background: var(--vip-muted);
    border-color: var(--vip-muted);
  }

  &.current {
    background: var(--vip-accent-amber);
    border-color: var(--vip-accent-amber);
    animation: ck-blink-warn 3s ease-in-out infinite;
  }

  &.success {
    background: var(--vip-accent-green);
    border-color: var(--vip-accent-green);
  }
}

.ck-step-line {
  flex: 1 1 0;
  min-width: 0.5rem;
  height: 0;
  margin-top: 1.5rem;
  border-top: 2px dashed rgba(255, 255, 255, 0.35);
  transition: border-color 0.2s ease;
  box-shadow: var(--vip-shadow-primary);

  &.pending {
    border-color: var(--vip-muted);
  }

  &.current {
    border-color: var(--vip-accent-amber);
    animation: ck-blink-warn 3s ease-in-out infinite;
  }

  &.success {
    border-top-style: solid;
    border-color: var(--vip-accent-green);
  }
}

@keyframes ck-blink-warn {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.ck-stepper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0;
}

.ck-content {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* ---------- Common panel ---------- */
.ck-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 14px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
  padding: 0.5rem;
  box-shadow: var(--vip-shadow-primary);
  margin-bottom: 0.5rem;

  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--vip-text);
  }

  p {
    margin: 0;
  }
}

/* Step 2 chiếm hết chiều cao, .scanned-list bên trong cuộn riêng. */
.ck-panel.nfc-step {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.plate-tag {

  font-weight: 900;
  font-size: 2rem;
  letter-spacing: 0.02em;
  width: 100%;
  height: 100%;
  min-height: 1.5rem;
  text-align: center;
  line-height: 1;
  text-transform: uppercase;
  color: var(--vip-accent-green);
}

/* ---------- Step 1: scan ---------- */
.scan-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);

  &.done {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.scan-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
}

.scan-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.1);
  color: var(--vip-accent-blue);
  font-size: 1.3rem;
  box-shadow: var(--vip-shadow-primary);

  .pi-check-circle {
    color: var(--vip-accent-green);
  }
}

.scan-card.done .scan-icon {
  background: rgba(16, 185, 129, 0.14);
}

.offline-plate-select {
  width: 100%;
}

.scan-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: 0.9rem;
    color: var(--vip-text);
  }
}

.scan-web-note {
  font-size: 0.72rem;
  color: var(--vip-muted);
  line-height: 1.3;
}

.scan-secondary-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: -0.3rem;
}

.vehicle-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);

  .plate-tag {
    align-self: flex-start;
    color: var(--vip-accent-green);
  }
}

/* ---------- Step 2: NFC ---------- */
.nfc-connect-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.7rem;
  flex-shrink: 0;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-primary);
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;

  &.connected {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.28);
  }

  &.connecting {
    border-color: rgba(37, 99, 235, 0.28);
  }

  &.disabled,
  &.unsupported,
  &.idle {
    border-color: rgba(245, 158, 11, 0.35);
    background: rgba(245, 158, 11, 0.06);
  }

  &.done {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }
}

.nfc-plate-side {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.nfc-plate-row {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  column-gap: 0.65rem;
  width: 100%;
}

.nfc-plate-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  border-radius: 12px;
  background: rgba(16, 155, 109, 0.1);
  border: 1px solid rgba(22, 170, 121, 0.25);
  box-shadow: var(--vip-shadow-primary);
  padding: 5px;
}

.nfc-plate-label {
  font-size: 0.72rem;
  color: black;
  font-weight: 500;
}

.plate-tag.compact {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  height: auto;
  min-height: 0;
  font-size: 1.35rem;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nfc-action-btns {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  justify-self: end;
}

.chip-btn-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.nfc-list-btn {
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow: var(--vip-shadow-primary);
}

.chip-note {
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  z-index: 2;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);

  &.warn {
    background: #f59e0b;
  }

  &.info {
    background: var(--vip-accent-blue);
  }
}

.sync-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vip-accent-amber);
  line-height: 1.4;
}

.nfc-status-side {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-width: 0;
  padding-top: 0.55rem;
  border-top: 1px solid var(--vip-border);
  position: relative;
  z-index: 1;
}

.nfc-status-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.nfc-status-tag {
  font-size: 0.8rem;
  width: fit-content;
  max-width: 100%;
  box-shadow: var(--vip-shadow-primary);
}

.nfc-hint {
  margin: 0;
  text-align: left;
  font-size: 0.9rem;
  color: var(--vip-muted);
  line-height: 1.35;
  max-width: none;
}

.nfc-pad {
  position: relative;
  flex-shrink: 0;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 70%);
  box-shadow: var(--vip-shadow-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  transition: transform 0.15s ease, box-shadow 0.2s ease;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: default;
    opacity: 0.75;
    animation: none;
  }

  i {
    position: relative;
    z-index: 2;
    font-size: 1rem;
    color: #fff;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 50%;
    background: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.25);
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }

  &.idle {
    animation: nfc-pad-breathe 2.2s ease-in-out infinite;
  }

  &.idle i,
  &.connecting i {
    background: #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
  }

  &.connecting {
    animation: nfc-pad-connecting 1.1s ease-in-out infinite;
  }

  &.connected {
    animation: nfc-pad-ready 2.4s ease-in-out infinite;
  }

  &.connected i,
  &.done i {
    background: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
  }

  &.done {
    animation: none;
  }

  &.disabled i,
  &.unsupported i {
    background: #f59e0b;
  }

  &.disabled,
  &.unsupported {
    animation: nfc-pulse 2s ease-in-out infinite;
  }
}

.nfc-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(16, 185, 129, 0.45);
  pointer-events: none;
  animation: nfc-ring-wave 2.4s ease-out infinite;

  &.r2 {
    animation-delay: 1.2s;
  }
}

@keyframes nfc-pad-breathe {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.35), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.04);
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pad-connecting {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pad-ready {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3), var(--vip-shadow-primary);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.06);
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-ring-wave {
  0% {
    transform: scale(0.7);
    opacity: 0.85;
  }

  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

.scanned-list-block {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 6rem;
  gap: 0.5rem;
}

.scanned-list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-shrink: 0;
}

.scanned-count {
  font-size: 0.85rem;
  color: var(--vip-accent-green);
}

.scanned-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem 0.5rem 0.5rem;
}

.recent-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--vip-muted);
  text-transform: uppercase;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  box-shadow: var(--vip-shadow-primary);
}

.recent-name {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--vip-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-time {
  font-size: 0.78rem;
  color: var(--vip-accent-green);
  font-weight: 600;
}

.recent-row-move,
.recent-row-enter-active,
.recent-row-leave-active {
  transition: all 0.3s ease;
}

.recent-row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.recent-row-leave-to {
  opacity: 0;
}

/* ---------- Sync modal list ---------- */
.list-modal-body {
  display: flex;
  flex-direction: column;
  max-height: min(70dvh, 32rem);
  min-height: 0;
}

.modal-employee-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.employee-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid var(--vip-border);
  background: var(--vip-surface);
  box-shadow: var(--vip-shadow-primary);
  transition: transform 0.15s ease;

  &.checked {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.employee-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 0.9rem;
    color: var(--vip-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 0.75rem;
    color: var(--vip-muted);
  }
}

.employee-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;

  small {
    font-size: 0.72rem;
    color: var(--vip-muted);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  box-shadow: var(--vip-shadow-primary);

  &.boarded {
    color: var(--vip-accent-green);
    background: rgba(16, 185, 129, 0.14);
  }

  &.pending {
    color: var(--vip-muted);
    background: var(--vip-surface-muted);
  }

  i {
    font-size: 0.65rem;
  }
}

.empty-hint {
  text-align: center;
  color: var(--vip-muted);
  font-size: 0.85rem;
  padding: 1.5rem 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.ck-stepper {

  .p-steppanel {
    padding: 3px 3px 0 3px;
    background: transparent;
  }

  .p-steppanels {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  .p-steppanel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
