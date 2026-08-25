import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STORE_KEY } from '../constants/storage'
import { useAuth } from './AuthContext'
import { storeApi } from '../api/storeApi'
import type { AssignedStore } from '../types'

interface StoreState {
  stores: AssignedStore[]
  selectedStoreId: number | null
  selectedStore: AssignedStore | null
  setSelectedStoreId: (id: number | null) => void
  canSelectAll: boolean
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreState | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, token } = useAuth()
  const [adminStores, setAdminStores] = useState<AssignedStore[]>([])
  const [selectedStoreId, setSelectedStoreIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? Number(raw) : null
  })

  // Fetch all stores for Admin users or if assignedStores is empty
  const fetchAllStores = async () => {
    if (!token) return
    try {
      const data = await storeApi.list()
      const mapped: AssignedStore[] = data
        .filter((s) => s.isActive)
        .map((s) => ({
          storeId: s.id,
          storeCode: s.storeCode,
          storeName: s.storeName,
          isPrimary: false,
        }))
      setAdminStores(mapped)
    } catch {
      /* ignore if offline or not permitted */
    }
  }

  useEffect(() => {
    if (token && (isAdmin || !user?.assignedStores?.length)) {
      void fetchAllStores()
    } else {
      setAdminStores([])
    }
  }, [token, isAdmin, user])

  // If admin, use all active stores from API (with fallback to assignedStores)
  // If staff, use assignedStores (with fallback to adminStores if assignedStores is empty)
  const stores = useMemo(() => {
    if (isAdmin && adminStores.length > 0) {
      return adminStores
    }
    if (user?.assignedStores?.length) {
      return user.assignedStores
    }
    return adminStores
  }, [isAdmin, adminStores, user])

  useEffect(() => {
    if (!stores.length) return
    const valid = selectedStoreId != null && stores.some((s) => s.storeId === selectedStoreId)
    if (valid) return

    const primary = stores.find((s) => s.isPrimary) ?? stores[0]
    // If admin and no store saved in localStorage, default to null (All Stores), otherwise primary store
    const saved = localStorage.getItem(STORE_KEY)
    if (isAdmin && !saved) {
      setSelectedStoreIdState(null)
    } else if (primary) {
      setSelectedStoreIdState(primary.storeId)
      localStorage.setItem(STORE_KEY, String(primary.storeId))
    }
  }, [stores, selectedStoreId, isAdmin])

  const setSelectedStoreId = (id: number | null) => {
    if (id != null && !stores.some((s) => s.storeId === id)) return
    if (id == null && !isAdmin) return
    setSelectedStoreIdState(id)
    if (id == null) localStorage.removeItem(STORE_KEY)
    else localStorage.setItem(STORE_KEY, String(id))
  }

  const value = useMemo<StoreState>(
    () => ({
      stores,
      selectedStoreId,
      selectedStore: stores.find((s) => s.storeId === selectedStoreId) ?? null,
      setSelectedStoreId,
      canSelectAll: isAdmin,
      refreshStores: fetchAllStores,
    }),
    [stores, selectedStoreId, isAdmin],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
