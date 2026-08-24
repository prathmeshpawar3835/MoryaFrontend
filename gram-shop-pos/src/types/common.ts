export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
}

export interface PagedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface PagedQuery {
  pageNumber?: number
  pageSize?: number
  search?: string
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  fromDate?: string
  toDate?: string
  storeId?: number | null
}

export const PaymentMode = {
  Cash: 1,
  Upi: 2,
  Card: 3,
  Credit: 4,
  Wallet: 5,
} as const
export type PaymentMode = number

export const BillStatus = {
  Completed: 1,
  PartiallyPaid: 2,
  Credit: 3,
  Cancelled: 4,
} as const
export type BillStatus = number

export const BillType = { Sale: 1, Exchange: 2 } as const
export type BillType = number

export const ReturnKind = { Return: 1, Exchange: 2 } as const
export type ReturnKind = number

export const StockMovementType = {
  Sale: 1,
  Return: 2,
  Purchase: 3,
  AdjustmentIn: 4,
  AdjustmentOut: 5,
  TransferIn: 6,
  TransferOut: 7,
  Exchange: 8,
  OpeningStock: 9,
} as const
export type StockMovementType = number

export const ReferralRewardStatus = {
  Pending: 1,
  Credited: 2,
  Redeemed: 3,
  Cancelled: 4,
} as const
export type ReferralRewardStatus = number

export const RewardType = { FixedAmount: 1, Percentage: 2 } as const
export type RewardType = number

export const RewardTrigger = { FirstPurchase: 1, EveryPurchase: 2 } as const
export type RewardTrigger = number

export const LedgerTransactionType = {
  Sale: 1,
  Return: 2,
  Credit: 3,
  PaymentReceived: 4,
  WalletCredit: 5,
  WalletRedeem: 6,
} as const
export type LedgerTransactionType = number

export const Roles = { Admin: 'Admin', SalesPerson: 'SalesPerson' } as const
