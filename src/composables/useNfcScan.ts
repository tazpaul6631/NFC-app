import { computed, onUnmounted, ref, shallowRef } from 'vue'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { CapacitorNfc, type NfcEvent, type NfcTag } from '@capgo/capacitor-nfc'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { bytesToHexUid, uidToCardNumber } from '@/utils/nfcUid'

/** Android reader flags: NFC-A/B/F/V + barcode + skip NDEF check (UID-first for raw Mifare). */
export const ANDROID_NFC_ALL_TAGS_FLAGS =
  0x1 | // FLAG_READER_NFC_A
  0x2 | // FLAG_READER_NFC_B
  0x4 | // FLAG_READER_NFC_F
  0x8 | // FLAG_READER_NFC_V
  0x10 | // FLAG_READER_NFC_BARCODE
  0x80 // FLAG_READER_SKIP_NDEF_CHECK

export type MifareFamily =
  | 'MIFARE Classic'
  | 'MIFARE Ultralight / NTAG'
  | 'MIFARE DESFire / Plus (IsoDep)'
  | 'NFC-A'
  | 'NFC-B'
  | 'NFC-F (FeliCa)'
  | 'NFC-V (ISO 15693)'
  | 'Unknown'

export interface ScannedNfcCard {
  uid: string
  uidRaw: number[]
  /** Mã decimal đảo byte (chỉ UID 4-byte), ví dụ 806497285. */
  cardNumber: string | null
  byteLength: number
  family: MifareFamily
  techTypes: string[]
  type: string | null
  eventType: string
  scannedAt: string
  tag: NfcTag
}

export function resolveMifareFamily(techTypes: string[] = [], fallbackType?: string | null): MifareFamily {
  const techs = techTypes.map((t) => t.toLowerCase())

  if (techs.some((t) => t.includes('mifareclassic'))) return 'MIFARE Classic'
  if (techs.some((t) => t.includes('mifareultralight'))) return 'MIFARE Ultralight / NTAG'
  if (techs.some((t) => t.includes('isodep'))) return 'MIFARE DESFire / Plus (IsoDep)'
  if (techs.some((t) => t.includes('nfca'))) return 'NFC-A'
  if (techs.some((t) => t.includes('nfcb'))) return 'NFC-B'
  if (techs.some((t) => t.includes('nfcf'))) return 'NFC-F (FeliCa)'
  if (techs.some((t) => t.includes('nfcv'))) return 'NFC-V (ISO 15693)'

  const hint = (fallbackType || '').toLowerCase()
  if (hint.includes('ultralight') || hint.includes('ntag')) return 'MIFARE Ultralight / NTAG'
  if (hint.includes('classic')) return 'MIFARE Classic'
  if (hint.includes('desfire')) return 'MIFARE DESFire / Plus (IsoDep)'

  return 'Unknown'
}

function mapTagEvent(event: NfcEvent): ScannedNfcCard {
  const techTypes = event.tag.techTypes ?? []
  const uidRaw = (event.tag.id ?? []).map((b) => b & 0xff)

  return {
    uid: bytesToHexUid(uidRaw),
    uidRaw,
    cardNumber: uidToCardNumber(uidRaw),
    byteLength: uidRaw.length,
    family: resolveMifareFamily(techTypes, event.tag.type),
    techTypes,
    type: event.tag.type ?? null,
    eventType: event.type,
    scannedAt: new Date().toISOString(),
    tag: event.tag,
  }
}

export function useNfcScan() {
  const isNative = Capacitor.isNativePlatform()
  const isScanning = ref(false)
  const isSupported = ref(false)
  const nfcStatus = ref<'unknown' | 'NFC_OK' | 'NO_NFC' | 'NFC_DISABLED' | 'NDEF_PUSH_DISABLED'>('unknown')
  const lastCard = shallowRef<ScannedNfcCard | null>(null)
  const errorMessage = ref<string | null>(null)

  const listeners = ref<PluginListenerHandle[]>([])

  const canScan = computed(() => isNative && isSupported.value && nfcStatus.value === 'NFC_OK')
  const statusLabel = computed(() => {
    if (!isNative) return 'web'
    if (!isSupported.value || nfcStatus.value === 'NO_NFC') return 'unsupported'
    if (nfcStatus.value === 'NFC_DISABLED') return 'disabled'
    if (nfcStatus.value === 'NFC_OK') return isScanning.value ? 'scanning' : 'ready'
    return 'unknown'
  })

  async function refreshStatus() {
    errorMessage.value = null

    if (!isNative) {
      isSupported.value = false
      nfcStatus.value = 'NO_NFC'
      return
    }

    try {
      const support = await CapacitorNfc.isSupported()
      isSupported.value = support.supported

      if (!support.supported) {
        nfcStatus.value = 'NO_NFC'
        return
      }

      const { status } = await CapacitorNfc.getStatus()
      nfcStatus.value = status
    } catch (err) {
      isSupported.value = false
      nfcStatus.value = 'NO_NFC'
      errorMessage.value = err instanceof Error ? err.message : String(err)
    }
  }

  async function clearListeners() {
    await Promise.all(listeners.value.map((l) => l.remove().catch(() => undefined)))
    listeners.value = []
  }

  async function startScan() {
    errorMessage.value = null
    await refreshStatus()

    if (!isNative) {
      errorMessage.value = 'NFC_WEB_ONLY'
      return
    }
    if (!isSupported.value || nfcStatus.value === 'NO_NFC') {
      errorMessage.value = 'NFC_UNSUPPORTED'
      return
    }
    if (nfcStatus.value === 'NFC_DISABLED') {
      errorMessage.value = 'NFC_DISABLED'
      return
    }
    if (isScanning.value) return

    await clearListeners()

    const nfcListener = await CapacitorNfc.addListener('nfcEvent', async (event) => {
      const card = mapTagEvent(event)
      if (!card.uid) return

      lastCard.value = card

      try {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } catch {
        // ignore
      }
    })

    listeners.value.push(nfcListener)

    await CapacitorNfc.startScanning({
      invalidateAfterFirstRead: false,
      alertMessage: 'Hold a Mifare / NFC card near the device',
      iosSessionType: 'tag',
      androidReaderModeFlags: ANDROID_NFC_ALL_TAGS_FLAGS,
    })

    isScanning.value = true
  }

  async function stopScan() {
    try {
      if (isScanning.value) {
        await CapacitorNfc.stopScanning()
      }
    } catch {
      // ignore
    } finally {
      isScanning.value = false
      await clearListeners()
    }
  }

  async function openNfcSettings() {
    if (!isNative) return
    await CapacitorNfc.showSettings()
  }

  function clearLastCard() {
    lastCard.value = null
  }

  onUnmounted(() => {
    void stopScan()
  })

  return {
    isNative,
    isScanning,
    isSupported,
    nfcStatus,
    canScan,
    statusLabel,
    lastCard,
    errorMessage,
    refreshStatus,
    startScan,
    stopScan,
    openNfcSettings,
    clearLastCard,
  }
}
