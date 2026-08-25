import { Roles } from '../types'

export type FeatureKey =
  | 'dashboard'
  | 'pos'
  | 'bills'
  | 'products.view'
  | 'products.write'
  | 'products.import'
  | 'categories.view'
  | 'categories.write'
  | 'inventory.view'
  | 'inventory.stockIn'
  | 'inventory.adjust'
  | 'inventory.transfer'
  | 'purchases'
  | 'customers'
  | 'returns'
  | 'referrals'
  | 'repairs'
  | 'suppliers'
  | 'discounts'
  | 'reports'
  | 'reports.profit'
  | 'settings'
  | 'users'
  | 'stores.write'
  | 'audit'

const allRoles = [Roles.Admin, Roles.SalesPerson]

export const FEATURE_ROLES: Record<FeatureKey, string[]> = {
  dashboard: allRoles,
  pos: allRoles,
  bills: allRoles,
  'products.view': allRoles,
  'products.write': [Roles.Admin],
  'products.import': [Roles.Admin],
  'categories.view': allRoles,
  'categories.write': [Roles.Admin],
  'inventory.view': allRoles,
  'inventory.stockIn': allRoles,
  'inventory.adjust': [Roles.Admin],
  'inventory.transfer': [Roles.Admin],
  purchases: allRoles,
  customers: allRoles,
  returns: allRoles,
  referrals: allRoles,
  repairs: allRoles,
  suppliers: [Roles.Admin],
  discounts: [Roles.Admin],
  reports: allRoles,
  'reports.profit': [Roles.Admin],
  settings: [Roles.Admin],
  users: [Roles.Admin],
  'stores.write': [Roles.Admin],
  audit: [Roles.Admin],
}

export function canAccess(role: string | undefined, feature: FeatureKey) {
  if (!role) return false
  return FEATURE_ROLES[feature].includes(role)
}
