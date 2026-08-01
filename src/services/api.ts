import axios from 'axios'
import { Preferences } from '@capacitor/preferences'
import baseURLApi from '@/api/baseURLApi'

const api = axios.create({
  baseURL: baseURLApi.url,
  timeout: 30000,
})

export const API_BASE_URL = baseURLApi.url

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
