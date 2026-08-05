import storageService from '@/services/storage.service'

export const CACHED_PLATES_KEY = 'vip_cached_number_plates'
export const CACHED_PLATES_SYNC_KEY = 'vip_cached_number_plates_last_sync'

/** Lưu danh sách biển số xuống Preferences (ghi đè toàn bộ). */
export async function saveCachedNumberPlates(plates: string[]): Promise<void> {
  const unique = [...new Set(plates.map((p) => p.trim()).filter(Boolean))]
  await storageService.set(CACHED_PLATES_KEY, unique)
  await storageService.set(CACHED_PLATES_SYNC_KEY, new Date().toISOString())
}

/** Đọc danh sách biển số từ Preferences. */
export async function loadCachedNumberPlates(): Promise<{
  plates: string[]
  lastSync: string | null
}> {
  const raw = await storageService.get(CACHED_PLATES_KEY, true)
  const lastSync = (await storageService.get(CACHED_PLATES_SYNC_KEY)) as string | null

  if (!Array.isArray(raw)) {
    return { plates: [], lastSync: lastSync || null }
  }

  const plates = [
    ...new Set(raw.map((p) => String(p).trim()).filter(Boolean)),
  ]

  return { plates, lastSync: lastSync || null }
}
