import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import type { ApiResponse } from '../types'
import { TOKEN_KEY, USER_KEY } from '../constants/storage'
import { safeReturnPath } from '../utils/paths'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5088/api'

export const axiosClient = axios.create({
  baseURL,
  timeout: 60000,
})

function isWrappedJson(data: unknown): data is ApiResponse<unknown> {
  return Boolean(data && typeof data === 'object' && 'success' in data && 'data' in (data as object))
}

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') return response
    const contentType = String(response.headers['content-type'] ?? '')
    if (contentType.includes('application/json') && isWrappedJson(response.data)) {
      if (!response.data.success) {
        return Promise.reject(
          Object.assign(new Error(response.data.message || 'Request failed'), {
            response,
            apiErrors: response.data.errors,
            userMessage: response.data.message,
          }),
        )
      }
      response.data = response.data.data
    }
    return response
  },
  async (error: AxiosError<ApiResponse<unknown> | Blob>) => {
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const parsed = JSON.parse(await error.response.data.text()) as ApiResponse<unknown>
        error.response.data = parsed
      } catch {
        /* keep blob */
      }
    }

    const payload = error.response?.data as ApiResponse<unknown> | undefined
    const status = error.response?.status
    const fieldErrors = (payload?.errors ?? []).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    const rawMessage = payload?.message?.trim()
    const combined =
      rawMessage && fieldErrors.length
        ? rawMessage.toLowerCase() === 'validation failed.'
          ? fieldErrors.join(' ')
          : [...new Set([rawMessage, ...fieldErrors])].join(' — ')
        : rawMessage || fieldErrors.join(' ')
    const message =
      combined ||
      (status === 401
        ? 'Your session has expired. Please sign in again.'
        : status === 403
          ? 'You do not have permission for this action.'
          : status === 404
            ? 'The requested record was not found.'
            : status === 409
              ? 'This record already exists.'
              : status === 422
                ? 'This action could not be completed. Check the details and try again.'
                : status === 429
                  ? 'Too many requests. Please wait a moment.'
                  : error.code === 'ECONNABORTED'
                    ? 'The request timed out. Please try again.'
                    : error.message === 'Network Error'
                      ? 'Cannot reach the API. Confirm the backend is running.'
                      : 'Something went wrong. Please try again.')

    const onLogin = window.location.pathname.startsWith('/login')
    const hadToken = Boolean(localStorage.getItem(TOKEN_KEY))

    if (status === 401 && hadToken && !onLogin) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      toast.error(message)
      const here = `${window.location.pathname}${window.location.search}`
      const next = safeReturnPath(here)
      const q = next !== '/dashboard' ? `?from=${encodeURIComponent(next)}` : ''
      window.location.assign(`/login${q}`)
    }

    return Promise.reject(Object.assign(error, { userMessage: message, apiErrors: payload?.errors ?? [] }))
  },
)

export async function downloadResponse(response: AxiosResponse<Blob>, fallbackName: string) {
  const blob = response.data
  if (blob.type.includes('application/json')) {
    const text = await blob.text()
    const json = JSON.parse(text) as ApiResponse<unknown>
    throw new Error(json.message || 'Download failed.')
  }
  const header = String(response.headers['content-disposition'] ?? '')
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(header)
  const name = match?.[1] ? decodeURIComponent(match[1]) : fallbackName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
