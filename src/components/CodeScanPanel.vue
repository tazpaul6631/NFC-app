<template>
  <div class="code-scan-panel">
    <div class="section">
      <div class="section-head">
        <strong>{{ t('settings.nfc.title') }}</strong>
        <Tag :value="nfcStatusText" :severity="nfcStatusSeverity" />
      </div>
      <div class="actions">
        <Button v-if="!isScanning" :label="t('settings.nfc.start')" icon="pi pi-wifi" :disabled="!isNative"
          :loading="starting" @click="onStart" />
        <Button v-else :label="t('settings.nfc.stop')" icon="pi pi-stop" severity="danger" outlined @click="onStop" />
        <Button v-if="nfcStatus === 'NFC_DISABLED'" :label="t('settings.nfc.openSettings')" icon="pi pi-cog"
          severity="secondary" outlined @click="openNfcSettings" />
      </div>
    </div>

    <div v-if="lastCard" class="result">
      <div class="result-header">
        <strong>{{ t('settings.nfc.lastScan') }}</strong>
        <Button icon="pi pi-times" text rounded severity="secondary" @click="clearLastCard" />
      </div>

      <dl class="result-grid">
        <dt>{{ t('settings.nfc.code') }}</dt>
        <dd class="mono">{{ lastCard.cardNumber || '—' }}</dd>

        <dt>{{ t('settings.nfc.type') }}</dt>
        <dd>{{ lastCard.family }}</dd>

        <dt>{{ t('settings.nfc.uid') }}</dt>
        <dd class="mono">{{ lastCard.uid }}</dd>
      </dl>

      <p v-if="uidWarning" class="error">{{ uidWarning }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useNfcScan } from '@/composables/useNfcScan'

const { t } = useI18n()
const toast = useToast()

const {
  isNative,
  isScanning,
  nfcStatus,
  statusLabel,
  lastCard,
  errorMessage,
  refreshStatus,
  startScan,
  stopScan,
  openNfcSettings,
  clearLastCard,
} = useNfcScan()

const starting = ref(false)

const nfcStatusSeverity = computed(() => {
  switch (statusLabel.value) {
    case 'scanning':
      return 'info'
    case 'ready':
      return 'success'
    case 'disabled':
      return 'warn'
    case 'unsupported':
    case 'web':
      return 'danger'
    default:
      return 'secondary'
  }
})

const nfcStatusText = computed(() => t(`settings.nfc.statusMap.${statusLabel.value}`))

const errorText = computed(() => {
  if (!errorMessage.value) return ''
  const key = `settings.nfc.errors.${errorMessage.value}`
  const translated = t(key)
  return translated === key ? errorMessage.value : translated
})

const uidWarning = computed(() => {
  if (!lastCard.value || lastCard.value.cardNumber) return ''
  return t('settings.nfc.errors.UID_NOT_4_BYTE', { length: lastCard.value.byteLength })
})

async function onStart() {
  starting.value = true
  try {
    await startScan()
    if (isScanning.value) {
      toast.add({
        severity: 'info',
        summary: t('settings.nfc.title'),
        detail: t('settings.nfc.scanningToast'),
        life: 2500,
      })
    } else if (errorMessage.value) {
      toast.add({
        severity: 'warn',
        summary: t('settings.nfc.title'),
        detail: errorText.value,
        life: 3000,
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('settings.nfc.title'),
      detail: err instanceof Error ? err.message : t('settings.nfc.errors.GENERIC'),
      life: 3000,
    })
  } finally {
    starting.value = false
  }
}

async function onStop() {
  await stopScan()
}

onMounted(() => {
  void refreshStatus()
})
</script>

<style scoped lang="scss">
.code-scan-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.result {
  border-top: 1px solid var(--vip-border);
  padding-top: 0.85rem;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.result-grid {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.45rem 0.75rem;
  margin: 0;

  dt {
    color: var(--vip-muted);
    font-size: 0.8rem;
  }

  dd {
    margin: 0;
    font-size: 0.9rem;
    word-break: break-all;
  }
}

.mono {
  letter-spacing: 0.02em;
}
</style>
