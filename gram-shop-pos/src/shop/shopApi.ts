import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { SHOP_TOKEN_KEY } from '../constants/storage'
import type { ApiResponse, PagedResponse } from '../types'
import type {
  ShopAuthResponse,
  ShopCategory,
  ShopCheckoutResponse,
  ShopCustomer,
  ShopInfo,
  ShopOffer,
  ShopOrder,
  ShopProduct,
  ShopProductDetail,
} from './shopTypes'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5088/api'

export const shopClient = axios.create({
  baseURL,
  timeout: 60000,
})

function isWrappedJson(data: unknown): data is ApiResponse<unknown> {
  return Boolean(data && typeof data === 'object' && 'success' in data && 'data' in (data as object))
}

shopClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(SHOP_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

shopClient.interceptors.response.use(
  (response) => {
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
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const payload = error.response?.data
    const status = error.response?.status
    const message =
      payload?.message?.trim() ||
      (status === 401
        ? 'Please sign in to continue.'
        : status === 422
          ? 'This action could not be completed. Check stock and try again.'
          : error.message === 'Network Error'
            ? 'Cannot reach the shop. Confirm the backend is running.'
            : 'Something went wrong. Please try again.')

    const onShopLogin = window.location.pathname.startsWith('/shop/login')
    const hadToken = Boolean(localStorage.getItem(SHOP_TOKEN_KEY))
    if (status === 401 && hadToken && !onShopLogin && window.location.pathname.startsWith('/shop')) {
      localStorage.removeItem(SHOP_TOKEN_KEY)
      toast.error(message)
      window.location.assign(`/shop/login?from=${encodeURIComponent(window.location.pathname)}`)
    }

    return Promise.reject(Object.assign(error, { userMessage: message, apiErrors: payload?.errors ?? [] }))
  },
)

export const shopApi = {
  info: async () => (await shopClient.get<ShopInfo>('/ecommerce/shop')).data,
  categories: async () => (await shopClient.get<ShopCategory[]>('/ecommerce/categories')).data,
  catalog: async (params: Record<string, unknown>) =>
    (await shopClient.get<PagedResponse<ShopProduct>>('/ecommerce/catalog', { params })).data,
  product: async (id: number) => (await shopClient.get<ShopProductDetail>(`/ecommerce/products/${id}`)).data,
  offers: async () => (await shopClient.get<ShopOffer[]>('/ecommerce/offers')).data,
  register: async (body: { name: string; mobile: string; address?: string; password: string }) =>
    (await shopClient.post<ShopAuthResponse>('/ecommerce/auth/register', body)).data,
  login: async (body: { mobile: string; password: string }) =>
    (await shopClient.post<ShopAuthResponse>('/ecommerce/auth/login', body)).data,
  me: async () => (await shopClient.get<ShopCustomer>('/ecommerce/me')).data,
  orders: async () => (await shopClient.get<PagedResponse<ShopOrder>>('/ecommerce/orders', { params: { pageSize: 50 } })).data,
  order: async (id: number) => (await shopClient.get<ShopOrder>(`/ecommerce/orders/${id}`)).data,
  checkout: async (body: {
    items: { productId: number; quantity: number }[]
    offerId?: number | null
    paymentMode: number
    paymentReference?: string
    address?: string
    notes?: string
  }) => (await shopClient.post<ShopCheckoutResponse>('/ecommerce/checkout', body)).data,
}
