import employeeCheckInApi from '@/api/employeeCheckIn'
import { toLocalCheckInTime, useCheckinListStore } from '@/store/checkinList'
import { useAuthStore } from '@/store/auth'
import { showAppToast } from '@/services/toastBridge'
import i18n from '@/i18n'
import { resolveApiError, resolveApiMessage } from '@/utils/apiMessage'

let syncing = false

export function isOfflineSyncing() {
  return syncing
}

/**
 * Đồng bộ offlineQueue lên server.
 * Thành công → chỉ xóa các bản ghi đã gửi khỏi queue (theo id), giữ display đến mốc đá.
 */
export async function syncOfflineQueue(options?: { silent?: boolean }): Promise<boolean> {
  const checkinList = useCheckinListStore()
  const authStore = useAuthStore()
  const t = i18n.global.t

  if (syncing || !checkinList.offlinePendingCount || !authStore.isOnline) return false

  syncing = true
  try {
    const pending = [...checkinList.offlineQueue]
    const syncedIds = pending.map((emp) => emp.id)
    const { data: body } = await employeeCheckInApi.createCheckInSyncData({
      data: pending.map((emp) => ({
        numberPlate: (emp.numberPlate || authStore.numberPlate || '').trim(),
        cardNumber: emp.cardNumber,
        employeeId: emp.employeeId,
        checkInTime: toLocalCheckInTime(emp.checkinAt),
      })),
    })

    if (!body?.success) {
      if (!options?.silent) {
        showAppToast({
          severity: 'warn',
          summary: String(t('checkin.sync.title')),
          detail: resolveApiMessage(body, 'checkin.sync.failed'),
          life: 3200,
        })
      }
      return false
    }

    checkinList.applySyncResults(body.data, syncedIds)
    showAppToast({
      severity: 'success',
      summary: String(t('checkin.sync.title')),
      detail: String(t('checkin.sync.successToast')),
      life: 2200,
    })
    return true
  } catch (err) {
    if (!options?.silent) {
      showAppToast({
        severity: 'error',
        summary: String(t('checkin.sync.title')),
        detail: resolveApiError(err, 'checkin.sync.failed'),
        life: 3200,
      })
    }
    return false
  } finally {
    syncing = false
  }
}
