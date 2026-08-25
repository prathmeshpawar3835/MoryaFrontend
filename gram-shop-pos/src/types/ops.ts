import type {
  BillStatus,
  BillType,
  LedgerTransactionType,
  PaymentMode,
  ReferralRewardStatus,
  ReturnKind,
  StockMovementType,
} from './common'
import type { PagedQuery } from './common'

export interface InventoryListQuery extends PagedQuery {
  productId?: number
  lowStockOnly?: boolean
}

export interface InventoryItem {
  id: number
  storeId: number
  storeCode: string
  productId: number
  productCode: string
  productName: string
  barcode?: string | null
  quantity: number
  minimumStockLevel: number
  isLowStock: boolean
  purchasePrice: number
  sellingPrice: number
}

export interface StockInRequest {
  storeId: number
  productId: number
  quantity: number
  purchasePrice?: number | null
  reason?: string
  supplierName?: string
  invoiceNumber?: string
}

export interface StockAdjustRequest {
  storeId: number
  productId: number
  quantity: number
  isIncrease: boolean
  reason: string
}

export interface StockTransferRequest {
  fromStoreId: number
  toStoreId: number
  reason?: string
  items: { productId: number; quantity: number }[]
}

export interface StockMovement {
  id: number
  productId: number
  productCode: string
  productName: string
  storeId: number
  quantity: number
  previousQuantity: number
  newQuantity: number
  movementType: StockMovementType
  referenceNumber?: string | null
  reason?: string | null
  createdDate: string
}

export interface Purchase {
  id: number
  storeId: number
  storeCode: string
  supplierId?: number | null
  supplierName: string
  invoiceNumber: string
  purchaseDate: string
  total: number
  notes?: string | null
  items: PurchaseItem[]
}

export interface PurchaseItem {
  productId: number
  productCode: string
  productName: string
  quantity: number
  purchasePrice: number
  total: number
}

export interface CreatePurchaseRequest {
  storeId: number
  supplierId?: number | null
  supplierName: string
  invoiceNumber: string
  date?: string
  notes?: string
  items: { productId: number; quantity: number; purchasePrice: number }[]
}

export interface CreateBillItemRequest {
  productId: number
  quantity: number
  discountAmount: number
}

export interface CreatePaymentRequest {
  paymentMode: PaymentMode
  amount: number
  referenceNumber?: string
}

export interface CreateBillRequest {
  storeId: number
  customerId?: number | null
  billDiscount: number
  notes?: string
  heldBillId?: number | null
  referralCode?: string
  referringMobileNumber?: string
  walletRedeemAmount: number
  salesPersonId?: number | null
  storeDiscountId?: number | null
  items: CreateBillItemRequest[]
  payments: CreatePaymentRequest[]
}

export interface BillItem {
  id: number
  productId: number
  productCode: string
  productName: string
  quantity: number
  rate: number
  purchasePrice: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  total: number
  returnedQuantity?: number
  exchangedQuantity?: number
  remainingQuantity?: number
  fulfillmentStatus?: number
}

export interface Payment {
  id: number
  paymentMode: PaymentMode
  amount: number
  referenceNumber?: string | null
  paymentDate: string
}

export interface Bill {
  id: number
  storeId: number
  storeCode: string
  storeName: string
  customerId?: number | null
  customerName?: string | null
  customerMobile?: string | null
  salesPersonId: number
  salesPersonName: string
  billNumber: string
  billDate: string
  billType: BillType
  status: BillStatus
  subtotal: number
  itemDiscountTotal: number
  billDiscount: number
  taxAmount: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  walletRedeemed: number
  referralDiscount?: number
  storeDiscountAmount?: number
  storeDiscountId?: number | null
  storeDiscountName?: string | null
  notes?: string | null
  items: BillItem[]
  payments: Payment[]
}

export interface BillListQuery extends PagedQuery {
  status?: BillStatus
  customerId?: number
}

export interface HeldBillRequest {
  storeId: number
  customerId?: number | null
  billDiscount: number
  notes?: string
  items: CreateBillItemRequest[]
}

export interface HeldBill {
  id: number
  storeId: number
  customerId?: number | null
  holdReference: string
  notes?: string | null
  billDiscount: number
  createdDate: string
  items: CreateBillItemRequest[]
}

export interface CreateReturnRequest {
  originalBillId: number
  reason?: string
  salesPersonId?: number | null
  items: { originalBillItemId: number; quantity: number }[]
}

export interface ReturnRecord {
  id: number
  storeId: number
  originalBillId: number
  originalBillNumber: string
  returnNumber: string
  returnDate: string
  customerId?: number | null
  returnAmount: number
  reason?: string | null
  returnKind: ReturnKind
  exchangeBillId?: number | null
  salesPersonId?: number | null
  salesPersonName?: string | null
  items: ReturnItem[]
}

export interface ReturnItem {
  originalBillItemId?: number
  productId: number
  productCode: string
  productName: string
  quantity: number
  rate: number
  total: number
}

export interface CreateExchangeRequest {
  originalBillId: number
  reason?: string
  returnItems: { originalBillItemId: number; quantity: number }[]
  newItems: CreateBillItemRequest[]
  billDiscount: number
  walletRedeemAmount: number
  salesPersonId?: number | null
  payments: CreatePaymentRequest[]
}

export interface ExchangeResult {
  return: ReturnRecord
  newBill: Bill
  differencePayable: number
}

export interface Invoice {
  shopName: string
  logoPath?: string | null
  businessAddress?: string | null
  businessMobile?: string | null
  businessEmail?: string | null
  gstNumber?: string | null
  storeName: string
  storeAddress?: string | null
  storeContact?: string | null
  storeGST?: string | null
  invoiceNumber: string
  invoiceDate: string
  customerName?: string | null
  customerMobile?: string | null
  customerAddress?: string | null
  products: BillItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payments: Payment[]
  amountPaid: number
  amountDue: number
  footer?: string | null
  returnPolicy?: string | null
}

export interface Customer {
  id: number
  storeId: number
  storeName: string
  name: string
  mobileNumber: string
  address?: string | null
  referralCode: string
  customerCode?: string
  referredByCustomerId?: number | null
  referredByName?: string | null
  outstandingBalance: number
  walletBalance: number
  isActive: boolean
  createdDate: string
}

export interface CreateCustomerRequest {
  storeId: number
  name: string
  mobileNumber: string
  address?: string
  referralCode?: string
  referringMobileNumber?: string
}

export interface UpdateCustomerRequest {
  name: string
  mobileNumber: string
  address?: string
  isActive: boolean
}

export interface CustomerHistory {
  customer: Customer
  bills: Bill[]
  returns: ReturnRecord[]
}

export interface LedgerEntry {
  id: number
  transactionDate: string
  transactionType: LedgerTransactionType
  description: string
  referenceNumber?: string | null
  debit: number
  credit: number
  balance: number
}

export interface CustomerPaymentRequest {
  storeId: number
  paymentMode: PaymentMode
  amount: number
  referenceNumber?: string
  paymentDate?: string
  notes?: string
}

export interface WalletRedeemRequest {
  storeId: number
  amount: number
  notes?: string
}

export interface Wallet {
  customerId: number
  balance: number
  transactions: WalletTransaction[]
}

export interface WalletTransaction {
  id: number
  amount: number
  balanceAfter: number
  transactionType: LedgerTransactionType
  description: string
  createdDate: string
}

export interface Referral {
  id: number
  referrerCustomerId: number
  referrerName: string
  referredCustomerId: number
  referredName: string
  rewardAmount: number
  saleAmount?: number
  discountGiven?: number
  referralCode?: string
  billNumber?: string | null
  status: ReferralRewardStatus
  referralDate: string
}

export interface StoreDiscount {
  id: number
  storeId: number
  storeName: string
  name: string
  discountKind: number
  value: number
  validFrom?: string | null
  validTo?: string | null
  isActive: boolean
}

export interface StoreDiscountRequest {
  storeId: number
  name: string
  discountKind: number
  value: number
  validFrom?: string | null
  validTo?: string | null
  isActive: boolean
}

export interface Supplier {
  id: number
  storeId?: number | null
  storeName?: string | null
  name: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  gstNumber?: string | null
  notes?: string | null
  isActive: boolean
  totalPurchased: number
}

export interface SupplierRequest {
  storeId?: number | null
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  gstNumber?: string
  notes?: string
  isActive: boolean
}

export interface RepairJob {
  id: number
  storeId: number
  jobNumber: string
  customerId?: number | null
  customerName: string
  mobileNumber: string
  billId?: number | null
  invoiceNumber?: string | null
  productId?: number | null
  productName: string
  productDetails?: string | null
  jobType: number
  status: number
  receivedDate: string
  expectedDate?: string | null
  completedDate?: string | null
  deliveredDate?: string | null
  notes?: string | null
  history: RepairJobHistory[]
}

export interface RepairJobHistory {
  status: number
  notes?: string | null
  createdDate: string
  userName: string
}

export interface CreateRepairJobRequest {
  storeId: number
  customerId?: number | null
  customerName: string
  mobileNumber: string
  billId?: number | null
  billItemId?: number | null
  productId?: number | null
  invoiceNumber?: string
  productName: string
  productDetails?: string
  jobType: number
  expectedDate?: string | null
  notes?: string
}

export interface UpdateRepairJobRequest {
  status: number
  expectedDate?: string | null
  notes?: string
}

export interface SalesPersonOption {
  id: number
  fullName: string
  userName: string
  isActive: boolean
}

export interface ReferralValidation {
  valid: boolean
  message?: string | null
  referrerCustomerId?: number | null
  referrerName?: string | null
  referrerMobile?: string | null
  referrerCode?: string | null
  referrerWalletBalance?: number
  newCustomerDiscountRate: number
  referrerBenefitRate: number
  rewardType: number
}
