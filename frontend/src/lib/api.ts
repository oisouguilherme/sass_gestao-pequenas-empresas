import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null
const subscribers: Array<() => void> = []

export function setAccessToken(token: string | null) {
  accessToken = token
  subscribers.forEach((cb) => cb())
}

export function getAccessToken() {
  return accessToken
}

export function onAuthChange(cb: () => void) {
  subscribers.push(cb)
  return () => {
    const i = subscribers.indexOf(cb)
    if (i >= 0) subscribers.splice(i, 1)
  }
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`
  }
  return config
})

async function refreshToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    setAccessToken(data.accessToken)
    return data.accessToken as string
  } catch {
    setAccessToken(null)
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const url = original?.url || ''
    if (
      status === 401 &&
      !original._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
        return api.request(original)
      }
    }
    return Promise.reject(error)
  },
)

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message || err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
