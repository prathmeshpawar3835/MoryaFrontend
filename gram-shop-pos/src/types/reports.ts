import type { RewardTrigger, RewardType } from './common'
import type { Bill } from './ops'
import type { InventoryItem } from './ops'
import type { PagedQuery, PagedResponse } from './common'

export interface Dashboard {
  todaySales: number
  todayBills: number
  todayCustomers: number
  pendingDues: number
  lowStockProducts: InventoryItem[]
  topSellingProducts: ProductSalesRow[]
  recentBills: Bill[]
  paymentModeSummary: PaymentModeSummary[]
  salesChartData: SalesChartPoint[]
}

export interface PaymentModeSummary {
  paymentMode: string
  amount: number
}

export interface SalesChartPoint {
  date: string
  sales: number
  billCount: number
}

export interface SalesReport {
  totalSales: number
  billCount: number
  tax: number
  discounts: number
  netSales: number
  paymentBreakdown: PaymentModeSummary[]
  bills: PagedResponse<Bill>
}

export interface ProductSalesRow {
  productId: number
  productCode: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface InventoryReportRow {
  storeId: number
  storeCode: string
  productId: number
  productCode: string
  productName: string
  quantity: number
  purchaseValue: number
  sellingValue: number
  isLowStock: boolean
}

export interface CustomerDueRow {
  customerId: number
  name: string
  mobile: string
  storeId: number
  outstandingAmount: number
  totalPurchases: number
  agingDays: number
}

export interface ReferralReportRow {
  referrerCustomerId: number
  referrerName: string
  referralCount: number
  pendingRewards: number
  creditedRewards: number
  redeemedRewards: number
}

export interface ProfitReportRow {
  billNumber: string
  billDate: string
  productCode: string
  productName: string
  quantity: number
  sellingAmount: number
  historicalPurchaseAmount: number
  discount: number
  profit: number
}

export interface ReportQuery extends PagedQuery {
  period?: string
}

export interface TaxSetting {
  id: number
  name: string
  percent: number
  isDefault: boolean
}

export interface Settings {
  shopName: string
  logoPath?: string | null
  address?: string | null
  mobile?: string | null
  email?: string | null
  gstNumber?: string | null
  invoiceFooter?: string | null
  returnPolicy?: string | null
  invoicePrefix: string
  invoiceNumberFormat: string
  financialYearStartMonth: number
  allowNegativeStock: boolean
  defaultTaxPercent: number
  lowStockDefaultLevel: number
  referralEnabled: boolean
  newCustomerReward: number
  referrerReward: number
  rewardType: RewardType
  rewardTrigger: RewardTrigger
  referralStoreWise: boolean
  taxSettings: TaxSetting[]
}

export interface AuditLog {
  id: number
  userId?: number | null
  userName?: string | null
  storeId?: number | null
  action: string
  entityName: string
  entityId?: string | null
  oldValue?: string | null
  newValue?: string | null
  ipAddress?: string | null
  createdDate: string
}
