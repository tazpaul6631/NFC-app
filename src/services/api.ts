import axios from 'axios'
import { Preferences } from '@capacitor/preferences'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'vip_token' })
  if (value) {
    config.headers.Authorization = `Bearer ${value}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Caller / auth store xử lý logout
    }
    return Promise.reject(error)
  },
)

export default api
