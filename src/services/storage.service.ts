import { Preferences } from '@capacitor/preferences'
import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'vip-secure-key-change-me'

class StorageService {
  async set(key: string, value: unknown, encrypt = false): Promise<void> {
    let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

    if (encrypt) {
      stringValue = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString()
    }

    await Preferences.set({ key, value: stringValue })
  }

  async get(key: string, isObject = false, encrypted = false): Promise<unknown> {
    const { value } = await Preferences.get({ key })
    if (!value) return null

    let finalValue = value

    if (encrypted) {
      const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY)
      finalValue = bytes.toString(CryptoJS.enc.Utf8)
    }

    try {
      return isObject ? JSON.parse(finalValue) : finalValue
    } catch {
      return finalValue
    }
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key })
  }

  async clear(): Promise<void> {
    await Preferences.clear()
  }

  async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys()
    return keys
  }
}

const storageService = new StorageService()
export default storageService
