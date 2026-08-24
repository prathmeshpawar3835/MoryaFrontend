import { z } from 'zod'

export const loginSchema = z.object({
  userName: z.string().min(1, 'User name is required'),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  userName: z.string().min(1, 'User name is required'),
})

export const resetPasswordSchema = z
  .object({
    userName: z.string().min(1, 'User name is required'),
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const productSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  productName: z.string().min(1, 'Product name is required'),
  barcode: z.string().optional(),
  categoryId: z.number().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0, 'MRP cannot be negative'),
  taxPercent: z.number().min(0).max(100),
  minimumStockLevel: z.number().min(0),
  openingStockStoreId: z.number().optional().nullable(),
  openingStock: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number'),
  address: z.string().optional(),
  storeId: z.number().min(1, 'Store is required'),
  referralCode: z.string().optional(),
  referringMobileNumber: z.string().optional(),
})

export const storeSchema = z.object({
  storeCode: z.string().min(1, 'Store code is required'),
  storeName: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const userSchema = z.object({
  userName: z.string().min(1, 'User name is required'),
  password: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  storeIds: z.array(z.number()).min(1, 'Assign at least one store'),
  isActive: z.boolean().optional(),
})
