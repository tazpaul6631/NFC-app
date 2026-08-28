/**
 * Gửi `clientRequestId` (uuid) lên BE — tắt đến khi staging xác nhận BE nhận field.
 * Bật sau khi test 1 request thật không bị reject.
 */
export const SEND_CHECKIN_IDEMPOTENCY_KEY = false

/** Fail cứng sau N lần lỗi liên tiếp — không retry vô hạn (dữ liệu sai / 4xx). */
export const CHECKIN_SYNC_MAX_RETRIES = 5

/** App crash giữa lúc syncing → mở lại coi quá X ms là pending để retry. */
export const CHECKIN_SYNCING_STALE_MS = 90_000
