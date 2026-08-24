import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STORE_KEY } from '../constants/storage'
import { useAuth } from './AuthContext'
import type { AssignedStore } from '../types'

interface StoreState {
  stores: AssignedStore[]
  selectedStoreId: number | null
  selectedStore: AssignedStore | null
  setSelectedStoreId: (id: number | null) => void
  canSelectAll: boolean
}

const StoreContext = createContext<StoreState | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth()
  const stores = user?.assignedStores ?? []
  const [selectedStoreId, setSelectedStoreIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? Number(raw) : null
  })

  useEffect(() => {
    if (!stores.length) return
    const valid = selectedStoreId != null && stores.some((s) => s.storeId === selectedStoreId)
    if (valid) return
    const primary = stores.find((s) => s.isPrimary) ?? stores[0]
    setSelectedStoreIdState(isAdmin ? null : primary.storeId)
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
