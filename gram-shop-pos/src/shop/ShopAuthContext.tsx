import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SHOP_TOKEN_KEY, SHOP_USER_KEY } from '../constants/storage'
import { shopApi } from './shopApi'
import type { ShopCustomer } from './shopTypes'

interface ShopAuthState {
  token: string | null
  customer: ShopCustomer | null
  loading: boolean
  login: (mobile: string, password: string) => Promise<void>
  register: (name: string, mobile: string, password: string, address?: string) => Promise<void>
  logout: () => void
}

const ShopAuthContext = createContext<ShopAuthState | undefined>(undefined)

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(SHOP_TOKEN_KEY))
  const [customer, setCustomer] = useState<ShopCustomer | null>(() => {
    const raw = localStorage.getItem(SHOP_USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as ShopCustomer
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(token))

  const persist = useCallback((nextToken: string | null, nextUser: ShopCustomer | null) => {
    setToken(nextToken)
    setCustomer(nextUser)
    if (nextToken) localStorage.setItem(SHOP_TOKEN_KEY, nextToken)
    else localStorage.removeItem(SHOP_TOKEN_KEY)
    if (nextUser) localStorage.setItem(SHOP_USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(SHOP_USER_KEY)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    void shopApi
      .me()
      .then((me) => persist(token, me))
      .catch(() => persist(null, null))
      .finally(() => setLoading(false))
  }, [token, persist])

  const login = useCallback(
    async (mobile: string, password: string) => {
      const result = await shopApi.login({ mobile, password })
      persist(result.accessToken, result.customer)
    },
    [persist],
  )

  const register = useCallback(
    async (name: string, mobile: string, password: string, address?: string) => {
      const result = await shopApi.register({ name, mobile, password, address })
      persist(result.accessToken, result.customer)
    },
    [persist],
  )

  const logout = useCallback(() => persist(null, null), [persist])

  const value = useMemo(
    () => ({ token, customer, loading, login, register, logout }),
    [token, customer, loading, login, register, logout],
  )

  return <ShopAuthContext.Provider value={value}>{children}</ShopAuthContext.Provider>
}

export function useShopAuth() {
  const ctx = useContext(ShopAuthContext)
  if (!ctx) throw new Error('useShopAuth must be used within ShopAuthProvider')
  return ctx
}
