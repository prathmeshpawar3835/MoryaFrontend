import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { TOKEN_KEY, USER_KEY } from '../constants/storage'
import type { CurrentUser, LoginRequest, LoginResponse } from '../types'

interface AuthState {
  token: string | null
  user: CurrentUser | null
  loading: boolean
  login: (body: LoginRequest) => Promise<LoginResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<CurrentUser | null>
  isAdmin: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function toCurrentUser(login: LoginResponse): CurrentUser {
  return {
    userId: login.userId,
    userName: login.userName,
    fullName: login.userName,
    role: login.role,
    assignedStores: login.assignedStores,
    mustChangePassword: login.mustChangePassword,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as CurrentUser
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(token))

  const persist = useCallback((nextToken: string | null, nextUser: CurrentUser | null) => {
    setToken(nextToken)
    setUser(nextUser)
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      persist(null, null)
      return null
    }
    try {
      const me = await authApi.me()
      persist(localStorage.getItem(TOKEN_KEY), me)
      return me
    } catch {
      persist(null, null)
      return null
    }
  }, [persist])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    void refreshUser().finally(() => setLoading(false))
  }, [token, refreshUser])

  const login = useCallback(
    async (body: LoginRequest) => {
      const result = await authApi.login(body)
      persist(result.accessToken, toCurrentUser(result))
      const me = await authApi.me().catch(() => toCurrentUser(result))
      persist(result.accessToken, me)
      return result
    },
    [persist],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* token may already be invalid */
    }
    persist(null, null)
  }, [persist])

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      refreshUser,
      isAdmin: user?.role === 'Admin',
    }),
    [token, user, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
