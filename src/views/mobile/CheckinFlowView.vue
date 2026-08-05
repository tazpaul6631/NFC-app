<template>
  <div class="checkin-flow mobile page-scroll-container">
    <div class="ck-header">
      <div class="ck-header-text">
        <strong>{{ t('checkin.header.title') }}</strong>
      </div>
    </div>

    <Stepper v-model:value="activeStep" class="ck-stepper">
      <div class="ck-content">
        <LottieLoader :visible="transitioning" :message="loadingMessage" />

        <StepPanels>
          <StepPanel value="1">
            <div class="ck-panel scan-step">
              <div class="scan-card">
                <div class="scan-icon-container">
                  <div class="scan-icon">
                    <i class="pi pi-qrcode" style="font-size: 1.2rem;" />
                  </div>
                  <div class="scan-info">
                    <strong>{{
                      authStore.isOnline ?
                        t('checkin.scan.hintOnline') : t('checkin.scan.hintOffline')
                    }}</strong>
                  </div>
                  <div v-if="offlinePendingCount > 0" class="nfc-action-btns">
                    <span class="chip-btn-wrap">
                      <Button class="nfc-list-btn" severity="warn" outlined size="large"
                        :aria-label="t('checkin.sync.open')" :title="t('checkin.sync.open')"
                        @click="syncModalVisible = true">
                        <template #icon>
                          <i class="pi pi-cloud-upload" style="font-size: 1.5rem;" />
                        </template>
                      </Button>
                      <span class="chip-note warn">{{ offlinePendingCount }}</span>
                    </span>
                  </div>
                </div>

                <Select v-if="offlineVehicleOptions" v-model="selectedPlate" :options="offlineVehicleOptions"
                  option-label="label" option-value="value" :placeholder="t('checkin.scan.selectPlatePlaceholder')"
                  class="offline-plate-select" size="large" :disabled="scanning"
                  @update:model-value="onOfflinePlateSelect" filter />
                <small v-if="offlineVehicleOptions" class="scan-hint-text"><strong><span class="text-danger">*</span>
                    {{
                      authStore.isOnline ?
                        t('checkin.scan.hintSelectOnline') : t('checkin.scan.hintSelectOffline')
                    }}</strong></small>
                <Button v-if="authStore.isOnline" :label="t('checkin.scan.scanButton')" size="large" :loading="scanning"
                  @click="handleScanClick" class="scan-button">
                  <template #icon><i class="pi pi-qrcode" style="font-size: 2rem;" /></template>
                </Button>
              </div>
            </div>
          </StepPanel>

          <StepPanel value="2">
            <div class="ck-panel nfc-step">
              <div class="nfc-connect-card">
                <div class="nfc-plate-side">
                  <div class="nfc-plate-row">
                    <div class="nfc-plate-text">
                      <span class="nfc-plate-label">{{ t('checkin.nfc.plateLabel') }}</span>
                      <span class="plate-tag compact">{{ vehicle.plate }}</span>
                    </div>
                    <div class="nfc-action-btns">
                      <span class="chip-btn-wrap">
                        <Button class="nfc-list-btn" severity="warn" outlined size="large"
                          :aria-label="t('checkin.sync.open')" :title="t('checkin.sync.open')"
                          @click="syncModalVisible = true">
                          <template #icon>
                            <i class="pi pi-cloud-upload" style="font-size: 1.5rem;" />
                          </template>
                        </Button>
                        <span v-if="offlinePendingCount > 0" class="chip-note warn">{{ offlinePendingCount }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="nfc-status-side">
                  <div class="scan-action-cluster">
                    <Tag :value="nfcStatusText" :severity="nfcStatusSeverity" class="nfc-status-tag" />
                    <button type="button" class="nfc-pad" :class="nfcUiState" :disabled="nfcConnecting"
                      :aria-label="nfcStatusText" @click="onNfcPadClick">
                      <i :class="nfcPadIcon" />
                    </button>
                  </div>

                  <div class="scan-action-cluster">
                    <Tag :value="t('checkin.nfc.barcode')" severity="success" class="nfc-status-tag" />
                    <button type="button" class="nfc-pad barcode-pad" :class="{ scanning: barcodeScanning }"
                      :disabled="barcodeScanning" :aria-label="t('checkin.nfc.barcode')" @click="onBarcodeScanClick">
                      <i :class="barcodeScanning ? 'pi pi-spin pi-spinner' : 'pi pi-barcode'" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="scanned-list-block">
                <div class="scanned-list-head">
                  <span class="recent-title">{{ t('checkin.nfc.recent') }}</span>
                  <strong v-show="checkedInCount > 0" class="scanned-count">({{ checkedInCount }})</strong>
                </div>

                <InputText v-if="scannedEmployees.length" v-model="filterEmployee" type="search"
                  class="scanned-list-filter" :placeholder="t('common.search')" />

                <div class="scanned-list">
                  <TransitionGroup v-if="filteredScannedEmployees.length" name="recent-row">
                    <div v-for="emp in filteredScannedEmployees" :key="emp.id" class="recent-row checked">
                      <div class="recent-avatar-wrap">
                        <Avatar :label="emp.initials" shape="circle"
                          :style="{ backgroundColor: emp.color, color: 'white', fontWeight: 'bold', boxShadow: `var(--vip-shadow-primary)` }" />
                        <i v-if="emp.pendingSync" class="pi pi-cloud-upload pending-cloud"
                          :title="t('checkin.sync.pendingTag')" :aria-label="t('checkin.sync.pendingTag')" />
                      </div>
                      <div class="recent-info">
                        <div class="recent-name-row">
                          <strong class="recent-name">{{ emp.name ? emp.name : '...' }}</strong>
                          <span class="recent-time">{{ emp.checkinTime }}</span>
                        </div>
                        <small class="recent-code">Id: {{ emp.code ? emp.code : '...' }}</small>
                        <small class="recent-card-number">Card: {{ emp.cardNumber ? emp.cardNumber : '...' }}</small>
                      </div>
                    </div>
                  </TransitionGroup>

                  <div v-else-if="scannedEmployees.length" class="scanned-empty">
                    <i class="pi pi-search" />
                    <strong>{{ t('checkin.nfc.filterEmpty') }}</strong>
                  </div>

                  <div v-else class="scanned-empty">
                    <i class="pi pi-users" />
                    <strong>{{ t('checkin.nfc.emptyList') }}</strong>
                    <p>{{ t('checkin.nfc.emptyListHint') }}</p>
                  </div>
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
        {{ t('checkin.nfc.completeConfirmMessage', { boarded: checkedInCount, total: checkedInCount }) }}
      </p>
      <template #footer>
        <Button :label="t('common.cancel')" severity="secondary" @click="completeConfirmVisible = false" size="large" />
        <Button :label="t('checkin.nfc.completeConfirmButton')" icon="pi pi-check" @click="confirmCompleteTrip"
          size="large" />
      </template>
    </Dialog>

    <OfflineSyncModal v-model="syncModalVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Stepper from 'primevue/stepper'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import Dialog from 'primevue/dialog'
import LottieLoader from '@/components/LottieLoader.vue'
import OfflineSyncModal from '@/components/OfflineSyncModal.vue'
import { useQrScan } from '@/composables/useQrScan'
import { useNfcScan } from '@/composables/useNfcScan'
import { useCheckinStepStore } from '@/store/checkinStep'
import { useAuthStore } from '@/store/auth'
import { toLocalCheckInTime, useCheckinListStore } from '@/store/checkinList'
import driverLoginApi from '@/api/driverLogin'
import employeeCheckInApi from '@/api/employeeCheckIn'
import { speakText } from '@/services/ttsService'
import { resolveApiError, resolveApiMessage } from '@/utils/apiMessage'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const checkinListStore = useCheckinListStore()
const { scannedEmployees, checkedInCount, offlinePendingCount } = storeToRefs(checkinListStore)

const filterEmployee = ref('')

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

/** List điểm danh ca hiện tại — filter theo name / code / cardNumber */
const filteredScannedEmployees = computed(() =>
  scannedEmployees.value.filter((emp) => matchesEmployeeFilter(emp, filterEmployee.value)),
)

onMounted(() => {
  void authStore.hydrateCachedNumberPlates()
})

const checkinStepStore = useCheckinStepStore()
const { activeStep } = storeToRefs(checkinStepStore)
const completedSteps = reactive(new Set<'1' | '2'>())
const transitioning = ref(false)
const loadingMessage = ref('')
const syncModalVisible = ref(false)
const completeConfirmVisible = ref(false)

function showLoader(message: string) {
  loadingMessage.value = message
  transitioning.value = true
}

function hideLoader() {
  transitioning.value = false
}

/* ---------- Step 1: scan ---------- */
const scanning = ref(false)
const tripCompleted = ref(false)
const selectedPlate = ref<string | null>(null)

const offlineVehicleOptions = computed(() => authStore.offlineVehicleOptions)

const vehicle = reactive({
  plate: authStore.numberPlate || ''
})

function proceedToNfcStep() {
  completedSteps.add('1')
  checkinListStore.startTrip()
  checkinStepStore.setStep('2')
}

async function fetchAndCacheNumberPlates() {
  showLoader(t('checkin.loading.default'))
  try {
    const { data: body } = await driverLoginApi.getVehicles()
    if (body?.success && Array.isArray(body.data) && body.data.length > 0) {
      await authStore.setCachedNumberPlates(body.data.map((item) => item.numberPlate))
      return true
    }

    toast.add({
      severity: 'warn',
      summary: t('checkin.scan.title'),
      detail: resolveApiMessage(body, 'checkin.scan.plateListEmpty'),
      life: 4000,
    })
    return false
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('checkin.scan.title'),
      detail: resolveApiError(err, 'checkin.scan.plateListFailed'),
      life: 4000,
    })
    return false
  } finally {
    hideLoader()
  }
}

async function loginWithNumberPlate(numberPlate: string) {
  const plate = numberPlate.trim()
  if (!plate) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.scan.title'),
      detail: t('checkin.scan.errors.NO_CODE'),
      life: 5000,
    })
    return false
  }

  try {
    const { data: body } = await driverLoginApi.postDriverLogin({ numberPlate: plate })
    console.log('body', body)
    if (!body?.success || !body.data?.accessToken) {
      toast.add({
        severity: 'warn',
        summary: t('checkin.scan.title'),
        detail: resolveApiMessage(body, 'checkin.scan.loginFailed'),
        life: 3200,
      })
      return false
    }

    authStore.setDriverSession({
      numberPlate: body.data.numberPlate || plate,
      accessToken: body.data.accessToken,
      expiresAt: body.data.expiresAt,
    })
    vehicle.plate = body.data.numberPlate || plate

    const hasPlates = await fetchAndCacheNumberPlates()
    if (!hasPlates) return false

    proceedToNfcStep()
    return true
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('checkin.scan.title'),
      detail: resolveApiError(err, 'checkin.scan.loginFailed'),
      life: 5000,
    })
    return false
  }
}

function onOfflinePlateSelect(plate: string | null) {
  if (!plate || scanning.value) return
  vehicle.plate = plate
  authStore.numberPlate = plate
  proceedToNfcStep()
}

const {
  isNative: isNativeScan,
  scanOnce,
  errorCode: qrErrorCode,
  BarcodeFormat,
} = useQrScan()

const barcodeScanning = ref(false)

const barcodeFormats = [
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.Code93,
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.QrCode,
]

async function handleScanClick() {
  if (scanning.value) return

  if (!isNativeScan) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.scan.title'),
      detail: t('checkin.scan.errors.QR_UNSUPPORTED'),
      life: 3200,
    })
    return
  }

  scanning.value = true
  showLoader(t('checkin.loading.scan'))
  try {
    const plate = await scanOnce([BarcodeFormat.QrCode])
    if (!plate) {
      hideLoader()
      return
    }
    const ok = await loginWithNumberPlate(plate)
    if (!ok) hideLoader()
  } finally {
    scanning.value = false
  }
}

async function onBarcodeScanClick() {
  if (barcodeScanning.value) return

  if (!isNativeScan) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.nfc.barcode'),
      detail: t('checkin.scan.errors.QR_UNSUPPORTED'),
      life: 3200,
    })
    return
  }

  barcodeScanning.value = true
  try {
    const code = await scanOnce(barcodeFormats)
    if (!code) {
      const key = qrErrorCode.value ? `checkin.scan.errors.${qrErrorCode.value}` : 'checkin.scan.errors.NO_CODE'
      const detail = t(key) === key ? t('checkin.scan.errors.GENERIC') : t(key)
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.barcode'),
        detail,
        life: 3200,
      })
      return
    }
    await checkInByEmployeeId(code)
  } finally {
    barcodeScanning.value = false
  }
}

/* ---------- Step 2: NFC / barcode check-in list ---------- */
function currentNumberPlate() {
  return (vehicle.plate || authStore.numberPlate || '').trim()
}

async function checkInByEmployeeId(employeeId: string) {
  const numberPlate = currentNumberPlate()
  if (!numberPlate) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.nfc.barcode'),
      detail: t('checkin.nfc.needScan'),
      life: 3200,
    })
    return false
  }

  if (checkinListStore.isAlreadyCheckedIn(employeeId)) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.nfc.barcode'),
      detail: t('checkin.nfc.alreadyCheckedIn'),
      life: 2800,
    })
    return false
  }

  if (!authStore.isOnline) {
    checkinListStore.addEmployee(
      {
        employeeId,
        employeeName: employeeId,
        cardNumber: '',
        checkInTime: toLocalCheckInTime(),
      },
      true,
      numberPlate,
    )
    void speakText('Xin cảm ơn')
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.barcode'),
      detail: `${employeeId} — ${t('checkin.sync.pendingTag')}`,
      life: 2200,
    })
    return true
  }

  showLoader(t('checkin.loading.nfc'))
  try {
    const { data: body } = await employeeCheckInApi.createCheckInByEmployeeId({
      numberPlate,
      employeeId,
    })

    if (!body?.success || !body.data) {
      void speakText('Xin thử lại')
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.barcode'),
        detail: resolveApiMessage(body, 'checkin.nfc.checkInFailed'),
        life: 3500,
      })
      return false
    }

    checkinListStore.addEmployee(body.data, false, numberPlate)
    void speakText('Xin cảm ơn')
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.barcode'),
      detail: `${body.data.employeeName} — ${t('checkin.list.checkedTag')}`,
      life: 2200,
    })
    return true
  } catch (err) {
    void speakText('Xin thử lại')
    toast.add({
      severity: 'error',
      summary: t('checkin.nfc.barcode'),
      detail: resolveApiError(err, 'checkin.nfc.checkInFailed'),
      life: 3500,
    })
    return false
  } finally {
    hideLoader()
  }
}

async function checkInByCardNumber(cardNumber: string) {
  const numberPlate = currentNumberPlate()
  if (!numberPlate || !cardNumber) return false

  if (checkinListStore.isAlreadyCheckedIn(cardNumber)) {
    toast.add({
      severity: 'warn',
      summary: t('checkin.nfc.title'),
      detail: t('checkin.nfc.alreadyCheckedIn'),
      life: 2800,
    })
    return false
  }

  if (!authStore.isOnline) {
    checkinListStore.addEmployee(
      {
        employeeId: '',
        employeeName: cardNumber,
        cardNumber,
        checkInTime: toLocalCheckInTime(),
      },
      true,
      numberPlate,
    )
    void speakText('Xin cảm ơn')
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.title'),
      detail: `${cardNumber} — ${t('checkin.sync.pendingTag')}`,
      life: 2200,
    })
    return true
  }

  showLoader(t('checkin.loading.nfc'))
  try {
    const { data: body } = await employeeCheckInApi.createCheckInByCardId({
      numberPlate,
      cardNumber,
    })

    if (!body?.success || !body.data) {
      void speakText('Xin thử lại')
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.title'),
        detail: resolveApiMessage(body, 'checkin.nfc.checkInFailed'),
        life: 3500,
      })
      return false
    }

    checkinListStore.addEmployee(body.data, false, numberPlate)
    void speakText('Xin cảm ơn')
    toast.add({
      severity: 'success',
      summary: t('checkin.nfc.title'),
      detail: `${body.data.employeeName} — ${t('checkin.list.checkedTag')}`,
      life: 2200,
    })
    return true
  } catch (err) {
    void speakText('Xin thử lại')
    toast.add({
      severity: 'error',
      summary: t('checkin.nfc.title'),
      detail: resolveApiError(err, 'checkin.nfc.checkInFailed'),
      life: 3500,
    })
    return false
  } finally {
    hideLoader()
  }
}

const nfcConnecting = ref(false)

const {
  isConnected: nfcConnected,
  nfcStatus,
  statusLabel: nfcStatusLabel,
  errorMessage: nfcError,
  refreshStatus: refreshNfcStatus,
  startScan: startNfcScan,
  stopScan: stopNfcScan,
  openNfcSettings,
} = useNfcScan({
  onCard: (card) => {
    const cardNumber = card.cardNumber ?? card.uid
    if (cardNumber) void checkInByCardNumber(cardNumber)
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
    case 'disabled':
      return t('checkin.nfc.status.disabled')
    case 'unsupported':
      return t('checkin.nfc.status.unsupported')
    default:
      return t('checkin.nfc.status.idle')
  }
})

const nfcHintText = computed(() => {
  if (nfcStatus.value === 'NFC_DISABLED') return t('checkin.nfc.hintDisabled')
  if (nfcStatusLabel.value === 'unsupported') return t('checkin.nfc.hintUnsupported')
  return t('checkin.nfc.hintConnect')
})

const nfcPadIcon = computed(() => {
  if (nfcConnecting.value) return 'pi pi-spin pi-spinner'
  if (nfcConnected.value) return 'pi pi-wifi'
  if (nfcStatus.value === 'NFC_DISABLED') return 'pi pi-ban'
  return 'pi pi-link'
})

async function connectNfc() {
  if (nfcConnected.value || nfcConnecting.value) return

  nfcConnecting.value = true
  try {
    await refreshNfcStatus()

    if (nfcStatus.value === 'NFC_DISABLED') {
      toast.add({
        severity: 'warn',
        summary: t('checkin.nfc.title'),
        detail: t('checkin.nfc.toastEnableNfc'),
        life: 3200,
      })
      await openNfcSettings()
      return
    }

    if (nfcStatusLabel.value === 'unsupported' || nfcStatus.value === 'NO_NFC') {
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
  if (nfcConnected.value) return
  await connectNfc()
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
  border-radius: 14px;
  padding: 0.85rem 1rem;
  color: #fff;
  box-shadow: var(--vip-shadow-primary);

  strong {
    font-size: 1.2rem;
    line-height: 1.25;
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
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: var(--vip-surface-soft);
  border: 1px solid var(--vip-border);

  &.done {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.scan-hint-text {
  margin-bottom: 0.5rem;
}

.text-danger {
  font-size: 0.8rem;
  color: red;
}

.scan-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 0.5rem;
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

.scan-button {
  font-size: 2rem;
}

.scan-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  strong {
    font-size: 1.1rem;
    color: var(--vip-text);
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
  padding: 5px 10px;
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
  animation: nfc-pulse 2s ease-in-out infinite;

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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  padding-top: 0.55rem;
  border-top: 1px solid var(--vip-border);
  position: relative;
  z-index: 1;
}

.scan-action-cluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.nfc-status-tag {
  font-size: 0.8rem;
  width: fit-content;
  max-width: 100%;
  box-shadow: var(--vip-shadow-primary);
}

.nfc-pad {
  position: relative;
  flex-shrink: 0;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
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
    animation: nfc-pad-breathe 2s ease-in-out infinite;
  }

  &.idle i,
  &.connecting i {
    background: #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
  }

  &.connecting {
    animation: nfc-pad-connecting 2s ease-in-out infinite;
  }

  &.connected i,
  &.done i {
    background: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
  }

  &.connected {
    animation: nfc-pad-ready 2s ease-in-out infinite;
  }

  &.disabled i,
  &.unsupported i {
    background: #f59e0b;
  }

  &.disabled,
  &.unsupported {
    animation: nfc-pulse 2s ease-in-out infinite;
  }

  &.barcode-pad i {
    background: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
  }

  &.barcode-pad {
    animation: nfc-pad-ready 2s ease-in-out infinite;
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
    transform: scale(1.04);
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pad-ready {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.04);
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.04);
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
  }
}

@keyframes nfc-pulse-cloud {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), var(--vip-shadow-primary);
  }

  50% {
    transform: scale(1.04);
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0), var(--vip-shadow-primary);
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

.scanned-list-filter {
  width: 100%;
  flex-shrink: 0;
}

.sync-list-filter {
  margin-bottom: 0.65rem;
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
  border: 1px solid var(--vip-border);
  box-shadow: var(--vip-shadow-primary);

  &.checked {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.25);
  }
}

.recent-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.pending-cloud {
  position: absolute;
  top: -10px;
  right: 20px;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  color: #fff;
  background: #d97706;
  animation: nfc-pulse-cloud 2s ease-in-out infinite;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.recent-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
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

.recent-time,
.employee-time {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--vip-accent-green);
  font-weight: 600;
}

.recent-code {
  color: var(--vip-muted);
  font-size: 0.75rem;
}

.recent-card-number {
  color: var(--vip-muted);
  font-size: 0.75rem;
}

.scanned-empty {
  flex: 1;
  min-height: 8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.75rem 1rem;
  text-align: center;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.55);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.65));

  i {
    font-size: 1.75rem;
    color: #94a3b8;
    margin-bottom: 0.15rem;
  }

  strong {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--vip-text);
  }

  p {
    margin: 0;
    max-width: 16rem;
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--vip-muted);
  }
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
  align-items: center;
  gap: 0.5rem;

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
