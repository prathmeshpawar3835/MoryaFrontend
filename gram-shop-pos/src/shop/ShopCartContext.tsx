import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { SHOP_CART_KEY } from '../constants/storage'
import type { ShopCartItem, ShopProduct } from './shopTypes'

interface ShopCartState {
  items: ShopCartItem[]
  count: number
  subtotal: number
  add: (product: ShopProduct, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}

const ShopCartContext = createContext<ShopCartState | undefined>(undefined)

function readCart(): ShopCartItem[] {
  try {
    const raw = localStorage.getItem(SHOP_CART_KEY)
    return raw ? (JSON.parse(raw) as ShopCartItem[]) : []
  } catch {
    return []
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopCartItem[]>(readCart)

  const persist = useCallback((next: ShopCartItem[]) => {
    setItems(next)
    localStorage.setItem(SHOP_CART_KEY, JSON.stringify(next))
  }, [])

  const add = useCallback(
    (product: ShopProduct, quantity = 1) => {
      if (!product.inStock || product.stockQuantity <= 0) {
        toast.error('This piece is sold out.')
        return
      }
      const current = readCart()
      const existing = current.find((x) => x.productId === product.id)
      const nextQty = (existing?.quantity ?? 0) + quantity
      if (nextQty > product.stockQuantity) {
        toast.error('Not enough stock for this quantity.')
        return
      }
      const row: ShopCartItem = {
        productId: product.id,
        productName: product.productName,
        productCode: product.productCode,
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp,
        imagePath: product.imagePath,
        imageUrl: product.imageUrl,
        quantity: nextQty,
        stockQuantity: product.stockQuantity,
      }
      persist(existing ? current.map((x) => (x.productId === product.id ? row : x)) : [...current, row])
      toast.success('Added to bag')
    },
    [persist],
  )

  const setQuantity = useCallback(
    (productId: number, quantity: number) => {
      const current = readCart()
      if (quantity <= 0) {
        persist(current.filter((x) => x.productId !== productId))
        return
      }
      persist(
        current.map((x) => {
          if (x.productId !== productId) return x
          if (quantity > x.stockQuantity) {
            toast.error('Not enough stock for this quantity.')
            return x
          }
          return { ...x, quantity }
        }),
      )
    },
    [persist],
  )

  const remove = useCallback(
    (productId: number) => persist(readCart().filter((x) => x.productId !== productId)),
    [persist],
  )

  const clear = useCallback(() => persist([]), [persist])

  const count = items.reduce((sum, x) => sum + x.quantity, 0)
  const subtotal = items.reduce((sum, x) => sum + x.sellingPrice * x.quantity, 0)

  const value = useMemo(
    () => ({ items, count, subtotal, add, setQuantity, remove, clear }),
    [items, count, subtotal, add, setQuantity, remove, clear],
  )

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext)
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider')
  return ctx
}
