import axios from 'axios'
import { authStore } from '../stores/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 30000,
})

// Attach Bearer token from auth store to every request.
// authStore.getState() is safe to call outside React — Zustand stores
// are plain JS objects. The store must be initialized before this runs,
// which is guaranteed by importing this file after store creation.
apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle backend's { status: false } as an application-level error,
// and HTTP 401 as session expiry requiring logout + redirect.
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as { status?: boolean; message?: string }
    if (data.status === false) {
      throw new Error(data.message ?? 'Request failed')
    }
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
