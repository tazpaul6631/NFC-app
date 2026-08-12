import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import type { EmployeeCheckInResult } from '@/api/employeeCheckIn'

export interface CheckedInEmployee {
  id: string
  employeeId: string
  name: string
  code: string
  cardNumber: string
  checkinTime: string
  checkinAt: string
  initials: string
  color: string
  pendingSync: boolean
  numberPlate: string
}

const AVATAR_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
  '#22c55e',
  '#eab308',
  '#d946ef',
  '#f43f5e',
  '#3b82f6',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#0284c7',
  '#db2777',
  '#0d9488',
  '#ca8a04',
  '#65a30d',
  '#9333ea',
  '#e11d48',
  '#0891b2',
  '#4f46e5',
  '#c026d3',
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function sortByNewest(a: CheckedInEmployee, b: CheckedInEmployee) {
  const tb = dayjs(b.checkinAt).valueOf()
  const ta = dayjs(a.checkinAt).valueOf()
  if (tb !== ta) return tb - ta
  return (b.id || '').localeCompare(a.id || '')
}

function plateMatches(empPlate: string, activePlate: string) {
  const a = activePlate.trim()
  if (!a) return true
  return (empPlate || '').trim() === a
}

/** Giờ local cho BE — không dùng UTC (`...Z`) */
export function toLocalCheckInTime(value?: string | Date | null) {
  const d = value ? dayjs(value) : dayjs()
  return (d.isValid() ? d : dayjs()).format('YYYY-MM-DDTHH:mm:ss')
}

function buildEmployee(
  result: EmployeeCheckInResult,
  pendingSync: boolean,
  numberPlate: string,
  index: number,
): CheckedInEmployee {
  const checkinAt = toLocalCheckInTime(result.checkInTime)
  return {
    id: `${result.employeeId || result.cardNumber}-${checkinAt}-${index}`,
    employeeId: result.employeeId,
    name: result.employeeName,
    code: result.employeeId,
    cardNumber: result.cardNumber,
    checkinTime: dayjs(checkinAt).format('HH:mm:ss'),
    checkinAt,
    initials: getInitials(result.employeeName || result.employeeId || result.cardNumber),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    pendingSync,
    numberPlate: numberPlate.trim(),
  }
}

export const useCheckinListStore = defineStore('checkinList', {
  state: () => ({
    /**
     * Display + persist theo từng biển (edge B: filter theo activeDisplayPlate).
     * Kick chỉ clear mảng này; offlineQueue giữ đến khi sync OK theo từng bản ghi.
     */
    employees: [] as CheckedInEmployee[],
    /** Hàng đợi offline — giữ đến khi sync xong, cộng dồn nhiều ca / nhiều biển */
    offlineQueue: [] as CheckedInEmployee[],
    /** Biển đang xem trên UI step 2 (Select / Scan QR) */
    activeDisplayPlate: '' as string,
    /** Thời điểm Select biển số / Scan QR bắt đầu ca */
    tripStartedAt: null as string | null,
    /** Modal nhắc gửi offline (global) */
    reminderModalVisible: false,
  }),

  getters: {
    checkedInCount(state) {
      const plate = state.activeDisplayPlate
      return state.employees.filter((e) => plateMatches(e.numberPlate, plate)).length
    },

    scannedEmployees(state) {
      const plate = state.activeDisplayPlate
      return state.employees
        .filter((e) => plateMatches(e.numberPlate, plate))
        .slice()
        .sort(sortByNewest)
    },

    offlinePendingEmployees: (state) => [...state.offlineQueue].sort(sortByNewest),

    offlinePendingCount: (state) => state.offlineQueue.length,

    isAlreadyCheckedIn(state) {
      return (code: string, plate?: string) => {
        const key = code.trim()
        if (!key) return false
        const p = (plate ?? state.activeDisplayPlate).trim()
        return state.employees.some(
          (e) =>
            plateMatches(e.numberPlate, p) &&
            (e.employeeId === key || e.cardNumber === key || e.code === key),
        )
      }
    },
  },

  actions: {
    /** Cập nhật biển đang xem — không xóa list biển khác (edge B). */
    setActivePlate(plate: string) {
      this.activeDisplayPlate = plate.trim()
    },

    startTrip() {
      this.tripStartedAt = toLocalCheckInTime()
    },

    addEmployee(result: EmployeeCheckInResult, pendingSync = false, numberPlate = '') {
      const plate = numberPlate.trim() || this.activeDisplayPlate
      const emp = buildEmployee(
        result,
        pendingSync,
        plate,
        this.employees.length + this.offlineQueue.length,
      )
      this.employees.unshift(emp)
      if (pendingSync) {
        this.offlineQueue.unshift({ ...emp })
      }
    },

    /**
     * Mốc đá: chỉ xóa display list.
     * Không đụng offlineQueue. (step 1 do kickWatcher / App gọi riêng — tránh circular store)
     */
    resetDisplayList() {
      this.employees = []
      this.tripStartedAt = null
      this.reminderModalVisible = false
    },

    async showReminderModal(withTts: boolean) {
      if (this.offlineQueue.length === 0) return
      this.reminderModalVisible = true
      const [{ vibrateHeavy, playBeep }, { speakImportantText }] = await Promise.all([
        import('@/services/alertSound'),
        import('@/services/ttsService'),
      ])
      await vibrateHeavy()
      await playBeep()
      if (withTts) {
        await speakImportantText('Vui lòng gửi dữ liệu offline trước giờ checkin')
      }
    },

    closeReminderModal() {
      this.reminderModalVisible = false
    },

    /**
     * Sau sync thành công:
     * - Merge tên/mã từ results vào display + queue nếu còn
     * - Chỉ xóa khỏi offlineQueue các bản ghi đã gửi (syncedQueueIds)
     * - Display giữ đến mốc đá; bỏ cờ pendingSync cho bản ghi đã sync
     */
    applySyncResults(results?: EmployeeCheckInResult[] | null, syncedQueueIds?: string[]) {
      if (Array.isArray(results) && results.length > 0) {
        for (const result of results) {
          const empId = (result.employeeId || '').trim()
          const card = (result.cardNumber || '').trim()
          const patch = (emp: CheckedInEmployee) => {
            if (result.employeeName) {
              emp.name = result.employeeName
              emp.initials = getInitials(result.employeeName)
            }
            if (empId) {
              emp.employeeId = empId
              emp.code = empId
            }
            if (card) emp.cardNumber = card
            if (result.checkInTime && dayjs(result.checkInTime).isValid()) {
              emp.checkinAt = toLocalCheckInTime(result.checkInTime)
              emp.checkinTime = dayjs(emp.checkinAt).format('HH:mm:ss')
            }
            emp.pendingSync = false
          }

          const inDisplay = this.employees.find(
            (e) =>
              (empId && (e.employeeId === empId || e.code === empId)) ||
              (card && e.cardNumber === card),
          )
          if (inDisplay) patch(inDisplay)

          const inQueue = this.offlineQueue.find(
            (e) =>
              (empId && (e.employeeId === empId || e.code === empId)) ||
              (card && e.cardNumber === card),
          )
          if (inQueue) patch(inQueue)
        }
      }

      if (syncedQueueIds?.length) {
        const idSet = new Set(syncedQueueIds)
        this.offlineQueue = this.offlineQueue.filter((e) => !idSet.has(e.id))
        this.employees.forEach((emp) => {
          if (idSet.has(emp.id)) emp.pendingSync = false
        })
      } else {
        // Fallback: batch sync không truyền id → xóa toàn bộ queue đã gửi
        this.offlineQueue = []
        this.employees.forEach((emp) => {
          if (emp.pendingSync) emp.pendingSync = false
        })
      }

      if (this.offlineQueue.length === 0) {
        this.reminderModalVisible = false
      }
    },

    /** Xóa hết (logout) — kể cả offline queue */
    clearAll() {
      this.employees = []
      this.offlineQueue = []
      this.activeDisplayPlate = ''
      this.tripStartedAt = null
      this.reminderModalVisible = false
    },
  },

  persist: {
    key: 'vip_checkin_list',
    pick: ['employees', 'offlineQueue', 'activeDisplayPlate', 'tripStartedAt'],
  },
})

/** Migrate bản cũ: pending trong employees → offlineQueue */
export function migrateCheckinListStore() {
  const store = useCheckinListStore()
  if (!Array.isArray(store.offlineQueue)) store.offlineQueue = []
  if (!store.offlineQueue.length && Array.isArray(store.employees)) {
    const pending = store.employees.filter((e) => e.pendingSync)
    if (pending.length) {
      store.offlineQueue = pending.map((e) => ({
        ...e,
        numberPlate: e.numberPlate || '',
      }))
    }
  }
  store.employees = (store.employees || []).map((e) => ({
    ...e,
    numberPlate: e.numberPlate || '',
  }))
  if (typeof store.activeDisplayPlate !== 'string') {
    store.activeDisplayPlate = ''
  }
}
