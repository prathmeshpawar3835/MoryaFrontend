import type { PagedQuery } from './common'

export interface AssignedStore {
  storeId: number
  storeCode: string
  storeName: string
  isPrimary: boolean
}

export interface LoginRequest {
  userName: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  expiration: string
  userId: number
  userName: string
  role: string
  assignedStores: AssignedStore[]
  mustChangePassword: boolean
}

export interface CurrentUser {
  userId: number
  userName: string
  fullName: string
  role: string
  email?: string
  assignedStores: AssignedStore[]
  mustChangePassword: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordResponse {
  message: string
  developmentResetToken?: string | null
}

export interface Store {
  id: number
  storeCode: string
  storeName: string
  address?: string | null
  contactNumber?: string | null
  gstNumber?: string | null
  invoicePrefix?: string | null
  isActive: boolean
  createdDate: string
  updatedDate?: string | null
}

export interface CreateStoreRequest {
  storeCode: string
  storeName: string
  address?: string
  contactNumber?: string
  gstNumber?: string
  invoicePrefix?: string
}

export interface UpdateStoreRequest extends CreateStoreRequest {
  isActive: boolean
}

export interface User {
  id: number
  userName: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  role: string
  isActive: boolean
  mustChangePassword: boolean
  storeIds: number[]
  createdDate: string
}

export interface CreateUserRequest {
  userName: string
  password: string
  fullName: string
  email?: string
  phoneNumber?: string
  role: string
  storeIds: number[]
}

export interface UpdateUserRequest {
  fullName: string
  email?: string
  phoneNumber?: string
  role: string
  isActive: boolean
  storeIds: number[]
}

export interface Category {
  id: number
  name: string
  codePrefix?: string | null
  description?: string | null
  isActive: boolean
  createdDate: string
}

export interface CreateCategoryRequest {
  name: string
  codePrefix?: string
  description?: string
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  isActive: boolean
}

export interface Product {
  id: number
  productCode: string
  barcode?: string | null
  productName: string
  categoryId: number
  categoryName: string
  unit: string
  purchasePrice: number
  sellingPrice: number
  mrp: number
  taxPercent: number
  minimumStockLevel: number
  imagePath?: string | null
  imageUrl?: string | null
  weightGrams?: number | null
  metal?: string | null
  isActive: boolean
  stockQuantity?: number | null
  isLowStock: boolean
  productUnitId?: number | null
  uniqueNumber?: string | null
  productUnitStatus?: number | null
}

export interface CreateProductRequest {
  productCode: string
  barcode?: string
  productName: string
  categoryId: number
  unit: string
  purchasePrice: number
  sellingPrice: number
  mrp: number
  taxPercent: number
  minimumStockLevel: number
  weightGrams?: number | null
  metal?: string
  openingStockStoreId?: number | null
  openingStock: number
}

export interface UpdateProductRequest {
  barcode?: string
  productName: string
  categoryId: number
  unit: string
  purchasePrice: number
  sellingPrice: number
  mrp: number
  taxPercent: number
  minimumStockLevel: number
  weightGrams?: number | null
  metal?: string
  isActive: boolean
}

export interface ProductUnit {
  id: number
  productId: number
  storeId: number
  storeCode: string
  uniqueNumber: string
  status: number
  statusName: string
  billItemId?: number | null
  createdDate: string
  productName: string
  categoryName: string
  purchasePrice: number
  mrp: number
  sellingPrice: number
  weightGrams?: number | null
  metal?: string | null
}

export interface UpdateProductUnitRequest {
  sellingPrice: number
  mrp: number
  purchasePrice?: number | null
}

export interface ProductUnitListQuery extends PagedQuery {
  productId?: number
  status?: number
}

export interface ProductListQuery extends PagedQuery {
  categoryId?: number
  lowStockOnly?: boolean
}

export interface ImportPreviewResponse {
  batchId: string
  validRowCount: number
  errorRowCount: number
  rows: ImportRowResult[]
}

export interface ImportRowResult {
  rowNumber: number
  isValid: boolean
  productCode?: string | null
  productName?: string | null
  errors: string[]
}

export interface ImportConfirmResponse {
  created: number
  updated: number
  inventoryUpdated: number
}
