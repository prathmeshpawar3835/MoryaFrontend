import type { RewardTrigger, RewardType } from './common'
import type { Bill } from './ops'
import type { InventoryItem } from './ops'
import type { PagedQuery, PagedResponse } from './common'

export interface Dashboard {
  todaySales: number
  todayBills: number
  todayCustomers: number
  pendingDues: number
  monthlySales: number
  monthlyBills: number
  todayReturns: number
  todayReturnCount: number
  monthlyReturns: number
  monthlyReturnCount: number
  todayExchanges: number
  todayExchangeCount: number
  monthlyExchanges: number
  monthlyExchangeCount: number
  todayBuybacks?: number
  todayBuybackCount?: number
  monthlyBuybacks?: number
  monthlyBuybackCount?: number
  todayCreditUsed?: number
  todayCreditGenerated?: number
  totalCustomers: number
  purchasingCustomers: number
  customerPurchaseRatio: number
  averageBillValue: number
  todayReferralCount: number
  todayReferralSales: number
  todayReferralDiscount: number
  todayReferralCost: number
  monthlyReferralCount: number
  monthlyReferralSales: number
  monthlyReferralDiscount: number
  monthlyReferralCost: number
  totalReferralCost: number
  todayBirthdayCustomers?: number
  todayBirthdayMessagesSent?: number
  todayBirthdayMessagesFailed?: number
  todayBirthdayOffersRedeemed?: number
  todayBirthdayDiscount?: number
  monthlyBirthdayOffersRedeemed?: number
  monthlyBirthdayDiscount?: number
  totalInventoryProducts: number
  totalInventoryQuantity: number
  lowStockCount: number
  outOfStockCount: number
  topReferrers: TopReferrer[]
  lowStockProducts: InventoryItem[]
  topSellingProducts: ProductSalesRow[]
  slowMovingProducts: ProductSalesRow[]
  recentBills: Bill[]
  paymentModeSummary: PaymentModeSummary[]
  salesChartData: SalesChartPoint[]
  referralChartData: SalesChartPoint[]
  exchangeReturnChart: ExchangeReturnChartPoint[]
}

export interface TopReferrer {
  customerId: number
  customerName: string
  customerCode: string
  referralCount: number
  referralSales: number
  benefitEarned: number
}

export interface ExchangeReturnChartPoint {
  date: string
  exchangeAmount: number
  returnAmount: number
  buybackAmount?: number
  exchangeCount: number
  returnCount: number
  buybackCount?: number
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
  returnAmount?: number
  exchangeAmount?: number
  buybackAmount?: number
  creditUsed?: number
  creditGenerated?: number
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
  isOutOfStock?: boolean
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
  referrerCode?: string
  referralCount: number
  referralSales?: number
  discountGiven?: number
  pendingRewards: number
  creditedRewards: number
  redeemedRewards: number
}

export interface BirthdayReportRow {
  customerId: number
  customerName: string
  mobileNumber: string
  dateOfBirth?: string | null
  storeName: string
  birthdayOffer?: string | null
  whatsAppStatus?: number | null
  redeemed: boolean
  invoiceNumber?: string | null
  discountAmount: number
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
  salesPersonId?: number
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
  birthdayDiscountPercent?: number
  whatsAppEnabled?: boolean
  whatsAppPhoneNumberId?: string | null
  whatsAppAccessToken?: string | null
  whatsAppApiBaseUrl?: string | null
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
