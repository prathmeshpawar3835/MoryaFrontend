import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { AuthLayout, MainLayout, POSLayout } from './layouts/Layouts'
import { ProtectedRoute, RoleProtectedRoute } from './routes/guards'
import { PageLoader } from './components/common/Feedback'

const LoginPage = lazy(() => import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./pages/Login/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/Login/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const AccessDeniedPage = lazy(() => import('./pages/Login/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage })))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const POSPage = lazy(() => import('./pages/POS/POSPage').then((m) => ({ default: m.POSPage })))
const HeldBillsPage = lazy(() => import('./pages/POS/HeldBillsPage').then((m) => ({ default: m.HeldBillsPage })))
const BillsPage = lazy(() => import('./pages/Bills/BillsPage').then((m) => ({ default: m.BillsPage })))
const BillDetailPage = lazy(() => import('./pages/Bills/BillDetailPage').then((m) => ({ default: m.BillDetailPage })))
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage').then((m) => ({ default: m.ProductsPage })))
const ProductFormPage = lazy(() => import('./pages/Products/ProductFormPage').then((m) => ({ default: m.ProductFormPage })))
const ProductViewPage = lazy(() => import('./pages/Products/ProductFormPage').then((m) => ({ default: m.ProductViewPage })))
const ProductImportPage = lazy(() => import('./pages/Products/ProductImportPage').then((m) => ({ default: m.ProductImportPage })))
const CategoriesPage = lazy(() => import('./pages/Categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })))
const StockPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.StockPage })))
const StockInPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.StockInPage })))
const StockAdjustPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.StockAdjustPage })))
const StockTransferPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.StockTransferPage })))
const StockLedgerPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.StockLedgerPage })))
const PurchasesPage = lazy(() => import('./pages/Inventory/InventoryPages').then((m) => ({ default: m.PurchasesPage })))
const CustomersPage = lazy(() => import('./pages/Customers/CustomerPages').then((m) => ({ default: m.CustomersPage })))
const CustomerProfilePage = lazy(() => import('./pages/Customers/CustomerPages').then((m) => ({ default: m.CustomerProfilePage })))
const CustomerLedgerPage = lazy(() => import('./pages/Customers/CustomerPages').then((m) => ({ default: m.CustomerLedgerPage })))
const DuesPage = lazy(() => import('./pages/Customers/CustomerPages').then((m) => ({ default: m.DuesPage })))
const ReferralsPage = lazy(() => import('./pages/Customers/CustomerPages').then((m) => ({ default: m.ReferralsPage })))
const ReturnsListPage = lazy(() => import('./pages/Returns/ReturnPages').then((m) => ({ default: m.ReturnsListPage })))
const ReturnCreatePage = lazy(() => import('./pages/Returns/ReturnPages').then((m) => ({ default: m.ReturnCreatePage })))
const ExchangePage = lazy(() => import('./pages/Returns/ReturnPages').then((m) => ({ default: m.ExchangePage })))
const SalesReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.SalesReportPage })))
const ProductSalesReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.ProductSalesReportPage })))
const InventoryReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.InventoryReportPage })))
const PurchasesReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.PurchasesReportPage })))
const ReturnsReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.ReturnsReportPage })))
const CustomerDuesReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.CustomerDuesReportPage })))
const ReferralReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.ReferralReportPage })))
const ProfitReportPage = lazy(() => import('./pages/Reports/ReportPages').then((m) => ({ default: m.ProfitReportPage })))
const StoresSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.StoresSettingsPage })))
const UsersSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.UsersSettingsPage })))
const BillingSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.BillingSettingsPage })))
const TaxSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.TaxSettingsPage })))
const ReferralSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.ReferralSettingsPage })))
const BusinessSettingsPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.BusinessSettingsPage })))
const AuditPage = lazy(() => import('./pages/Settings/SettingsPages').then((m) => ({ default: m.AuditPage })))
const CustomerLedgerSearchPage = lazy(() => import('./pages/Ops/FeaturePages').then((m) => ({ default: m.CustomerLedgerSearchPage })))
const DiscountsPage = lazy(() => import('./pages/Ops/FeaturePages').then((m) => ({ default: m.DiscountsPage })))
const SuppliersPage = lazy(() => import('./pages/Ops/FeaturePages').then((m) => ({ default: m.SuppliersPage })))
const RepairsPage = lazy(() => import('./pages/Ops/FeaturePages').then((m) => ({ default: m.RepairsPage })))
const ProductAnalyticsPage = lazy(() => import('./pages/Ops/FeaturePages').then((m) => ({ default: m.ProductAnalyticsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<POSLayout />}>
                    <Route path="/pos" element={<POSPage />} />
                  </Route>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/access-denied" element={<AccessDeniedPage />} />
                    <Route path="/pos/held" element={<HeldBillsPage />} />
                    <Route path="/bills" element={<BillsPage />} />
                    <Route path="/bills/:id" element={<BillDetailPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route element={<RoleProtectedRoute feature="products.write" />}>
                      <Route path="/products/create" element={<ProductFormPage />} />
                      <Route path="/products/edit/:id" element={<ProductFormPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="products.import" />}>
                      <Route path="/products/import" element={<ProductImportPage />} />
                    </Route>
                    <Route path="/products/:id" element={<ProductViewPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/inventory" element={<Navigate to="/inventory/stock" replace />} />
                    <Route path="/inventory/stock" element={<StockPage />} />
                    <Route path="/inventory/stock-in" element={<StockInPage />} />
                    <Route path="/inventory/ledger" element={<StockLedgerPage />} />
                    <Route path="/inventory/purchases" element={<PurchasesPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/dues" element={<DuesPage />} />
                    <Route path="/customers/ledger" element={<CustomerLedgerSearchPage />} />
                    <Route path="/customers/:id" element={<CustomerProfilePage />} />
                    <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
                    <Route path="/referrals" element={<ReferralsPage />} />
                    <Route path="/returns" element={<ReturnsListPage />} />
                    <Route path="/returns/new" element={<ReturnCreatePage />} />
                    <Route path="/returns/exchange" element={<ExchangePage />} />
                    <Route path="/repairs" element={<RepairsPage />} />
                    <Route path="/reports/sales" element={<SalesReportPage />} />
                    <Route path="/reports/products" element={<ProductSalesReportPage />} />
                    <Route path="/reports/product-analytics" element={<ProductAnalyticsPage />} />
                    <Route path="/reports/inventory" element={<InventoryReportPage />} />
                    <Route path="/reports/purchases" element={<PurchasesReportPage />} />
                    <Route path="/reports/returns" element={<ReturnsReportPage />} />
                    <Route path="/reports/customers" element={<CustomerDuesReportPage />} />
                    <Route path="/reports/referrals" element={<ReferralReportPage />} />

                    <Route element={<RoleProtectedRoute feature="inventory.adjust" />}>
                      <Route path="/inventory/adjustment" element={<StockAdjustPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="inventory.transfer" />}>
                      <Route path="/inventory/transfer" element={<StockTransferPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="suppliers" />}>
                      <Route path="/inventory/suppliers" element={<SuppliersPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="reports.profit" />}>
                      <Route path="/reports/profit" element={<ProfitReportPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="settings" />}>
                      <Route path="/settings/stores" element={<StoresSettingsPage />} />
                      <Route path="/settings/users" element={<UsersSettingsPage />} />
                      <Route path="/settings/billing" element={<BillingSettingsPage />} />
                      <Route path="/settings/tax" element={<TaxSettingsPage />} />
                      <Route path="/settings/referrals" element={<ReferralSettingsPage />} />
                      <Route path="/settings/business" element={<BusinessSettingsPage />} />
                      <Route path="/settings/audit" element={<AuditPage />} />
                    </Route>
                    <Route element={<RoleProtectedRoute feature="discounts" />}>
                      <Route path="/settings/discounts" element={<DiscountsPage />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
