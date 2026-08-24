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
  items: ReturnItem[]
}

export interface ReturnItem {
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
  status: ReferralRewardStatus
  referralDate: string
}
