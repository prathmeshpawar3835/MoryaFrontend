export interface ShopInfo {
  shopName: string
  logoPath?: string | null
  address?: string | null
  mobile?: string | null
  email?: string | null
  storeId: number
  storeName: string
}

export interface ShopCategory {
  id: number
  name: string
  codePrefix?: string | null
  description?: string | null
}

export interface ShopProduct {
  id: number
  productCode: string
  productName: string
  categoryId: number
  categoryName: string
  unit: string
  sellingPrice: number
  mrp: number
  discountPercent?: number | null
  imagePath?: string | null
  imageUrl: string
  weightGrams?: number | null
  metal?: string | null
  stockQuantity: number
  inStock: boolean
}

export interface ShopProductDetail extends ShopProduct {
  description?: string | null
  taxPercent: number
  related: ShopProduct[]
}

export interface ShopOffer {
  id: number
  name: string
  description?: string | null
  discountKind: number
  value: number
  validFrom?: string | null
  validTo?: string | null
}

export interface ShopCustomer {
  id: number
  name: string
  mobile: string
  address?: string | null
  customerCode: string
}

export interface ShopAuthResponse {
  accessToken: string
  expiration: string
  customer: ShopCustomer
}

export interface ShopCartItem {
  productId: number
  productName: string
  productCode: string
  unit: string
  sellingPrice: number
  mrp: number
  imagePath?: string | null
  imageUrl: string
  quantity: number
  stockQuantity: number
}

export interface ShopOrderItem {
  productId: number
  productCode: string
  productName: string
  quantity: number
  rate: number
  discountAmount: number
  total: number
}

export interface ShopOrder {
  id: number
  orderNumber: string
  orderDate: string
  status: number
  statusName: string
  subtotal: number
  discount: number
  discountName?: string | null
  taxAmount: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  paymentMode?: string | null
  notes?: string | null
  customerName?: string | null
  customerMobile?: string | null
  customerAddress?: string | null
  items: ShopOrderItem[]
}

export interface ShopCheckoutResponse {
  order: ShopOrder
  notificationSent: boolean
  notificationMessage?: string | null
}

export const ShopPaymentMode = {
  Cash: 1,
  Upi: 2,
  Card: 3,
  Cod: 4,
} as const
