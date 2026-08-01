/**
 * Chuyển UID NFC 4-byte sang mã thẻ decimal (kiểu máy chấm công cũ).
 *
 * Ví dụ: 05:2C:12:30 → đảo byte → 0x30122C05 → "806497285"
 * Không pad 0 đầu — khớp BE đang lưu dạng không pad.
 *
 * Chỉ áp dụng khi UID đúng 4 byte. Thẻ 7 byte trả về null.
 */
export function uidToCardNumber(uidBytes: number[] | undefined | null): string | null {
  if (!uidBytes || uidBytes.length !== 4) return null

  const reversedHex = [...uidBytes]
    .reverse()
    .map((b) => (b & 0xff).toString(16).padStart(2, '0'))
    .join('')

  return BigInt(`0x${reversedHex}`).toString()
}

/** Hex UID có dấu `:` — ví dụ `05:2C:12:30`. */
export function bytesToHexUid(bytes: number[] | undefined, separator = ':'): string {
  if (!bytes?.length) return ''
  return bytes.map((b) => (b & 0xff).toString(16).padStart(2, '0').toUpperCase()).join(separator)
}
