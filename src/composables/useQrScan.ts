import { ref } from 'vue'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import {
  BarcodeFormat,
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
  type Barcode,
} from '@capacitor-mlkit/barcode-scanning'

export type QrScanErrorCode =
  | 'QR_WEB_ONLY'
  | 'QR_UNSUPPORTED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'MODULE_UNAVAILABLE'
  | 'NO_CODE'
  | 'GENERIC'

export function useQrScan() {
  const isNative = Capacitor.isNativePlatform()
  const isAndroid = Capacitor.getPlatform() === 'android'
  const isScanning = ref(false)
  const isInstallingModule = ref(false)
  const lastBarcode = ref<Barcode | null>(null)
  const errorCode = ref<QrScanErrorCode | null>(null)

  async function ensurePermission(): Promise<boolean> {
    const { camera } = await BarcodeScanner.checkPermissions()
    if (camera === 'granted' || camera === 'limited') return true
    if (camera === 'denied') return false

    const { camera: requested } = await BarcodeScanner.requestPermissions()
    return requested === 'granted' || requested === 'limited'
  }

  async function ensureGoogleModule(): Promise<boolean> {
    if (!isAndroid) return true

    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
    if (available) return true

    isInstallingModule.value = true
    try {
      await new Promise<void>((resolve, reject) => {
        let handle: PluginListenerHandle | undefined

        BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event) => {
          if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
            handle?.remove()
            resolve()
          } else if (
            event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
            event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
          ) {
            handle?.remove()
            reject(new Error('MODULE_INSTALL_FAILED'))
          }
        }).then((h) => {
          handle = h
        })

        BarcodeScanner.installGoogleBarcodeScannerModule().catch(reject)
      })
      return true
    } catch {
      return false
    } finally {
      isInstallingModule.value = false
    }
  }

  async function scanOnce(): Promise<string | null> {
    errorCode.value = null
    lastBarcode.value = null

    if (!isNative) {
      errorCode.value = 'QR_WEB_ONLY'
      return null
    }

    try {
      const { supported } = await BarcodeScanner.isSupported()
      if (!supported) {
        errorCode.value = 'QR_UNSUPPORTED'
        return null
      }

      const granted = await ensurePermission()
      if (!granted) {
        errorCode.value = 'CAMERA_PERMISSION_DENIED'
        return null
      }

      const moduleReady = await ensureGoogleModule()
      if (!moduleReady) {
        errorCode.value = 'MODULE_UNAVAILABLE'
        return null
      }

      isScanning.value = true
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] })
      const barcode = barcodes[0] ?? null
      lastBarcode.value = barcode

      const value = barcode?.rawValue || barcode?.displayValue || null
      if (!value) {
        errorCode.value = 'NO_CODE'
        return null
      }
      return value
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
      errorCode.value = message.includes('permission') ? 'CAMERA_PERMISSION_DENIED' : 'GENERIC'
      return null
    } finally {
      isScanning.value = false
    }
  }

  async function openSettings() {
    if (!isNative) return
    await BarcodeScanner.openSettings()
  }

  return {
    isNative,
    isScanning,
    isInstallingModule,
    lastBarcode,
    errorCode,
    scanOnce,
    openSettings,
  }
}
