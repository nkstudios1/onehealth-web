import axios, { AxiosError } from 'axios'

const BASE_URL = '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Attach access token to every request ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auto-refresh on 401 ─────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        isRefreshing = false
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/login/refresh/`, { refresh })
        // Backend uses "success" key; normalize in case of legacy "status" shape
        const payload = data.data ?? data
        const newAccess: string = payload.access ?? data.access
        localStorage.setItem('access_token', newAccess)
        const newRefresh: string | undefined = payload.refresh ?? data.refresh
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh)
        }
        processQueue(null, newAccess)
        originalRequest.headers!.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

/** Pull the first error message out of a DRF error response. */
export function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    const d = err.response?.data
    if (typeof d?.message === 'string') return d.message
    if (d?.errors) {
      const first = Object.values(d.errors)[0]
      if (Array.isArray(first)) return first[0] as string
      if (typeof first === 'string') return first
    }
    if (typeof d?.detail === 'string') return d.detail
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
