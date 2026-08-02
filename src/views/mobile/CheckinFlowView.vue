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
                    <i :class="vehicleConfirmed ? 'pi pi-check-circle' : 'pi pi-qrcode'" />
                  </div>
                  <div class="scan-info">
                    <strong>{{ vehicleConfirmed ? t('checkin.scan.doneLabel') : t('checkin.scan.hint') }}</strong>
                  </div>
                </div>
                <Button v-if="!vehicleConfirmed" :label="t('checkin.scan.scanButton')" icon="pi pi-qrcode"
                  size="large" :loading="scanning" @click="handleScanClick" />
              </div>

              <div v-if="!vehicleConfirmed" class="scan-secondary-actions">
                <Button v-if="qrErrorCode === 'CAMERA_PERMISSION_DENIED'" :label="t('checkin.scan.openSettings')"
                  icon="pi pi-cog" text size="small" @click="openCameraSettings" />
                <Button :label="t('checkin.scan.skipButton')" text size="small"
                  severity="secondary" @click="skipScan" />
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
              <div class="nfc-plate-bar">
                <span class="nfc-plate-label">{{ t('checkin.nfc.plateLabel') }}</span>
                <span class="plate-tag compact">{{ vehicle.plate }}</span>
              </div>

              <button type="button" class="nfc-pad" :disabled="allCheckedIn" @click="simulateNfcTap">
                <span class="nfc-ring r1" />
                <span class="nfc-ring r2" />
                <i class="pi pi-wifi" />
              </button>
              <p class="nfc-hint">{{ allCheckedIn ? t('checkin.nfc.allDone') : t('checkin.nfc.prompt') }}</p>

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

              <div class="step-actions">
                <Button :label="t('checkin.nfc.viewList')" class="flex-1" @click="goNext" size="large" />
              </div>
            </div>
          </StepPanel>

          <StepPanel value="3">
            <div class="ck-panel list-step">
              <h2>{{ t('checkin.list.title') }} - {{ todayLabel }}</h2>

              <div class="stat-cards">
                <div class="stat-card">
                  <strong><i class="pi pi-users" /> {{ employees.length }}</strong>
                  <span>{{ t('checkin.list.total') }}</span>
                </div>
                <div class="stat-card success">
                  <strong><i class="pi pi-check-circle" /> {{ checkedInCount }}</strong>
                  <span>{{ t('checkin.list.boarded') }}</span>
                </div>
                <div class="stat-card muted">
                  <strong><i class="pi pi-clock" /> {{ employees.length - checkedInCount }}</strong>
                  <span>{{ t('checkin.list.notChecked') }}</span>
                </div>
              </div>

              <IconField class="search-field">
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchQuery" :placeholder="t('checkin.list.searchPlaceholder')" class="w-full" />
              </IconField>

              <div class="filter-tabs">
                <button v-for="f in filters" :key="f.key" type="button" class="filter-tab"
                  :class="{ active: activeFilter === f.key }" @click="activeFilter = f.key">
                  {{ f.label }}
                </button>
              </div>

              <div class="employee-list">
                <div v-for="emp in filteredEmployees" :key="emp.id" class="employee-row"
                  :class="{ checked: emp.checkedIn }">
                  <Avatar :label="emp.initials" shape="circle" :style="{ backgroundColor: emp.color }" />
                  <div class="employee-info">
                    <strong>{{ emp.name }}</strong>
                    <small>{{ emp.code }} · {{ emp.dept }}</small>
                  </div>
                  <div class="employee-status">
                    <span v-if="emp.checkedIn" class="status-badge boarded">
                      <i class="pi pi-check" /> {{ t('checkin.list.checkedTag') }}
                    </span>
                    <span v-else class="status-badge pending">{{ t('checkin.list.notCheckedTag') }}</span>
                    <small v-if="emp.checkinTime">{{ emp.checkinTime }}</small>
                  </div>
                </div>

                <p v-if="!filteredEmployees.length" class="empty-hint">{{ t('checkin.list.empty') }}</p>
              </div>

              <div class="step-actions">
                <Button :label="t('checkin.list.back')" severity="secondary" outlined class="flex-1"
                  @click="goBack" />
                <Button :label="`${t('checkin.list.complete')} (${checkedInCount}/${employees.length})`"
                  class="flex-1" @click="completeTrip" />
              </div>
            </div>
          </StepPanel>
        </StepPanels>
      </div>
    </Stepper>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import Stepper from 'primevue/stepper'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import LottieLoader from '@/components/LottieLoader.vue'
import { useQrScan } from '@/composables/useQrScan'
import { useCheckinStepStore } from '@/store/checkinStep'

interface Employee {
  id: number
  name: string
  code: string
  dept: string
  checkedIn: boolean
  checkinTime: string | null
  initials: string
  color: string
}

const { t } = useI18n()
const toast = useToast()

/* ---------- Header clock ---------- */
const todayLabel = dayjs().format('D/M/YYYY')
let clockTimer: ReturnType<typeof setInterval> | undefined

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

/* ---------- Stepper state ----------
 * activeStep được lưu trong Pinia store (checkinStep) làm nguồn duy nhất cho
 * biết đang ở bước nào — tab bar, đường nối giữa các bước đều đọc từ đây nên
 * luôn đồng bộ với nhau và với transition khi chuyển bước.
 */
const checkinStepStore = useCheckinStepStore()
const { activeStep } = storeToRefs(checkinStepStore)

/** Tập các bước đã hoàn tất (hiện success ở chỉ báo bước) — chỉ được thêm vào
 * khi bấm "Next" (rời khỏi bước đó) hoặc khi hoàn tất chuyến ở bước 3. */
const completedSteps = reactive(new Set<'1' | '2' | '3'>())

const transitioning = ref(false)
const loadingMessage = ref('')

function flashLoader(message: string, ms = 650) {
  loadingMessage.value = message
  transitioning.value = true
  setTimeout(() => {
    transitioning.value = false
  }, ms)
}

function goNext() {
  completedSteps.add(activeStep.value)
  checkinStepStore.next()
  flashLoader(t('checkin.loading.default'))
}

function goBack() {
  checkinStepStore.prev()
  flashLoader(t('checkin.loading.default'), 450)
}

/* ---------- Step 1: scan mock ---------- */
const scanning = ref(false)
const vehicleConfirmed = ref(false)
/** true khi đã bấm "Hoàn tất chuyến" ở bước 3 — dùng để tắt chớp ở step 3. */
const tripCompleted = ref(false)

const vehicle = reactive({
  plate: '51B-223.45',
  routeCode: 'Tuyến 04',
  from: 'Long An',
  to: 'KCN',
  driver: 'Nguyễn Văn Sáng',
  capacity: 29,
  departure: '06:42',
  eta: '07:15',
})

function simulateScan() {
  if (vehicleConfirmed.value || scanning.value) return
  scanning.value = true
  flashLoader(t('checkin.loading.scan'), 1100)
  setTimeout(() => {
    scanning.value = false
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

/** Chưa có mã QR thật để test — cho phép bỏ qua bước quét để tiếp tục các bước sau. */
function skipScan() {
  if (vehicleConfirmed.value) return
  vehicleConfirmed.value = true
}

/* ---------- Step 2: NFC mock ---------- */
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
  }
}

const employees = reactive<Employee[]>([
  makeEmployee(1, 'Nguyễn Văn Hùng', 'NV0231', 'Xưởng lắp ráp 1', true, '09:59:54'),
  makeEmployee(2, 'Trần Thị Mai', 'NV0198', 'Kiểm định chất lượng', true, '09:59:56'),
  makeEmployee(3, 'Lê Hoàng Phúc', 'NV0312', 'Xưởng lắp ráp 2', true, '09:59:57'),
  makeEmployee(4, 'Phạm Thị Ngọc Anh', 'NV0087', 'Kho vận', true, '09:59:59'),
  makeEmployee(5, 'Đỗ Minh Tuấn', 'NV0155', 'Bảo trì thiết bị', true, '10:00:01'),
  makeEmployee(6, 'Vũ Thị Ánh', 'NV0259', 'Bảo trì thiết bị', true, '10:00:02'),
  makeEmployee(7, 'Bùi Văn Long', 'NV0221', 'Kho vận', false, null),
  makeEmployee(8, 'Hoàng Thị Lan', 'NV0203', 'Kiểm định chất lượng', false, null),
  makeEmployee(9, 'Ngô Đức Thắng', 'NV0176', 'Xưởng lắp ráp 1', false, null),
  makeEmployee(10, 'Trịnh Thị Kim Oanh', 'NV0142', 'Nhân sự', false, null),
])

const checkedInCount = computed(() => employees.filter((e) => e.checkedIn).length)
const allCheckedIn = computed(() => checkedInCount.value === employees.length)

function isStepDone(value: '1' | '2' | '3') {
  return completedSteps.has(value)
}

const STEP_ICONS: Record<'1' | '2' | '3', string> = {
  '1': 'pi pi-qrcode',
  '2': 'pi pi-wifi',
  '3': 'pi pi-list',
}

const STEP_LABEL_KEYS: Record<'1' | '2' | '3', string> = {
  '1': 'checkin.tabs.scan',
  '2': 'checkin.tabs.nfc',
  '3': 'checkin.tabs.list',
}

const stepIndicatorList = computed(() =>
  (['1', '2', '3'] as const).map((value) => {
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

function simulateNfcTap() {
  const next = employees.find((e) => !e.checkedIn)
  if (!next) return
  flashLoader(t('checkin.loading.nfc'), 350)
  setTimeout(() => {
    next.checkedIn = true
    next.checkinTime = dayjs().format('HH:mm:ss')
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.title'),
      detail: `${next.name} — ${t('checkin.list.checkedTag')}`,
      life: 1800,
    })
  }, 350)
}

/* ---------- Step 3: list mock ---------- */
const searchQuery = ref('')
const activeFilter = ref<'all' | 'boarded' | 'pending'>('all')

const filters = computed(() => [
  { key: 'all' as const, label: t('checkin.list.filters.all') },
  { key: 'boarded' as const, label: t('checkin.list.filters.boarded') },
  { key: 'pending' as const, label: t('checkin.list.filters.notChecked') },
])

const filteredEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return employees.filter((emp) => {
    if (activeFilter.value === 'boarded' && !emp.checkedIn) return false
    if (activeFilter.value === 'pending' && emp.checkedIn) return false
    if (!q) return true
    return emp.name.toLowerCase().includes(q) || emp.code.toLowerCase().includes(q)
  })
})

function completeTrip() {
  completedSteps.add('3')
  tripCompleted.value = true
  toast.add({
    severity: 'success',
    summary: t('checkin.list.title'),
    detail: t('checkin.list.completedToast'),
    life: 2500,
  })
}
</script>

<style scoped lang="scss">
.checkin-flow {
  display: flex;
  flex-direction: column;
  padding-bottom: 1rem;
}

/* ---------- Header ---------- */
.ck-header {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-bottom: 0.85rem;
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
  padding-top: 0.9rem;
  border-radius: 14px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-1);
  padding: 0.9rem 1rem;

  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--vip-text);
  }
}

/* Step 2 chiếm hết chiều cao khả dụng, .scanned-list bên trong cuộn riêng. */
.ck-panel.nfc-step {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.step-actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.25rem;
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
  box-shadow: var(--vip-shadow-1);

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

  .pi-check-circle {
    color: var(--vip-accent-green);
  }
}

.scan-card.done .scan-icon {
  background: rgba(16, 185, 129, 0.14);
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
  box-shadow: var(--vip-shadow-1);

  .plate-tag {
    align-self: flex-start;
    color: var(--vip-accent-green);
  }
}

/* ---------- Step 2: NFC ---------- */
.nfc-plate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
}

.nfc-plate-label {
  font-size: 0.78rem;
  color: var(--vip-muted);
  font-weight: 500;
}

.plate-tag.compact {
  font-size: 1.15rem;
  min-height: 0;
}

.nfc-pad {
  position: relative;
  align-self: center;
  flex-shrink: 0;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 70%);
  box-shadow: var(--vip-shadow-1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  i {
    position: relative;
    z-index: 2;
    font-size: 1.4rem;
    color: #fff;
    width: 2.85rem;
    height: 2.85rem;
    border-radius: 50%;
    background: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45);
  }
}

.nfc-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(245, 158, 11, 0.35);
  animation: nfc-pulse 2.4s ease-out infinite;

  &.r2 {
    animation-delay: 1.2s;
  }
}

@keyframes nfc-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }

  100% {
    transform: scale(1.15);
    opacity: 0;
  }
}

.nfc-hint {
  margin: -0.35rem 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--vip-muted);
  flex-shrink: 0;
}

/* Khối danh sách đã điểm danh: chiếm hết phần chiều cao còn lại của step 2,
   chỉ riêng .scanned-list cuộn dữ liệu bên trong — UI tổng thể không cuộn trang. */
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
  padding-right: 0.15rem;
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

/* ---------- Step 3: list ---------- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.75rem 0.4rem;
  border-radius: 12px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-1);

  i {
    font-size: 1rem;
    color: var(--vip-accent-blue);
    margin-bottom: 0.1rem;
  }

  strong {
    font-size: 1.2rem;
    color: var(--vip-text);
    line-height: 1.1;
  }

  span {
    font-size: 0.7rem;
    color: var(--vip-muted);
    text-align: center;
  }

  &.success {
    i {
      color: var(--vip-accent-green);
    }

    strong {
      color: var(--vip-accent-green);
    }
  }

  &.muted {
    i {
      color: var(--vip-muted);
    }

    strong {
      color: var(--vip-muted);
    }
  }
}

.search-field {
  width: 100%;
}

.filter-tabs {
  display: flex;
  gap: 0.4rem;
  padding: 0.25rem;
  border-radius: 10px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);
}

.filter-tab {
  flex: 1;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--vip-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

  &.active {
    background: var(--vip-accent-blue);
    color: #fff;
    font-weight: 600;
    box-shadow: var(--vip-shadow-1);
  }
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
  box-shadow: var(--vip-shadow-1);
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
/* Không còn StepList/Step (đã thay bằng .ck-step-indicator thuần UI ở header),
   chỉ còn cần chỉnh style cho StepPanels/StepPanel để nội dung chiếm hết chiều
   cao còn lại, cho .ck-panel.nfc-step tự tính vùng cố định / vùng cuộn riêng. */
.ck-stepper {
  .p-steppanel, .p-steppanels {
    padding: 0;
    background: transparent;
  }

  .p-steppanels {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .p-steppanel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
