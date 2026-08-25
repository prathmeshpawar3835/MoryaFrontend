import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, ErrorState, PageLoader, CurrencyDisplay } from '../../components/common/Feedback'
import { formatDateTime } from '../../utils/format'
import { BILL_STATUS_LABELS } from '../../constants/labels'
import { canAccess } from '../../constants/permissions'

const COLORS = ['#0b1d33', '#d4af37', '#173b68', '#64748b', '#22c55e']

export function DashboardPage() {
  const { selectedStoreId } = useStore()
  const { user } = useAuth()
  const q = useQuery({
    queryKey: queryKeys.dashboard(selectedStoreId),
    queryFn: () => dashboardApi.get(selectedStoreId),
  })

  if (q.isLoading) return <PageLoader label="Fetching live POS metrics…" />
  if (q.isError || !q.data) return <ErrorState message="Could not load dashboard data. Please check network connection." />

  const d = q.data
  return (
    <>
      <PageHeader
        title="Store Operations Dashboard"
        subtitle="Real-time sales, billing figures, and inventory alerts"
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-pos-shortcut" to="/pos">
              <i className="bi bi-cash-stack" />
              <span>New Bill (F10)</span>
            </Link>
            {canAccess(user?.role, 'products.write') ? (
              <Link className="btn btn-outline-secondary btn-sm" to="/products/create">
                <i className="bi bi-plus-lg me-1" /> Add Product
              </Link>
            ) : null}
            <Link className="btn btn-outline-secondary btn-sm" to="/customers">
              <i className="bi bi-person-plus me-1" /> Customer
            </Link>
            <Link className="btn btn-outline-secondary btn-sm" to="/inventory/stock-in">
              <i className="bi bi-box-arrow-in-down me-1" /> Stock In
            </Link>
            <Link className="btn btn-outline-secondary btn-sm" to="/reports/sales">
              <i className="bi bi-graph-up me-1" /> Reports
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-header">
            <span>Today's Sales</span>
            <div className="kpi-icon"><i className="bi bi-currency-rupee" /></div>
          </div>
          <strong>
            <CurrencyDisplay value={d.todaySales} />
          </strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Today's Bills</span>
            <div className="kpi-icon"><i className="bi bi-receipt" /></div>
          </div>
          <strong>{d.todayBills}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Customers Served</span>
            <div className="kpi-icon"><i className="bi bi-people" /></div>
          </div>
          <strong>{d.todayCustomers}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Pending Dues (Udhaar)</span>
            <div className="kpi-icon text-danger bg-danger-subtle"><i className="bi bi-wallet2" /></div>
          </div>
          <strong className="text-danger">
            <CurrencyDisplay value={d.pendingDues} />
          </strong>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <div className="card-panel h-100">
            <h2>
              <i className="bi bi-graph-up text-warning" /> Sales Trend
            </h2>
            {d.salesChartData.length ? (
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={d.salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5, 10)} stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#d4af37' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No sales recorded in this period.</div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-panel h-100">
            <h2>
              <i className="bi bi-pie-chart text-primary" /> Payment Modes
            </h2>
            {d.paymentModeSummary.length ? (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={d.paymentModeSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="paymentMode" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {d.paymentModeSummary.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No payments received today.</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-panel h-100">
            <h2>
              <i className="bi bi-trophy text-warning" /> Top Selling Products
            </h2>
            {d.topSellingProducts.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={d.topSellingProducts} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="productName" width={130} stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#0b1d33" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No product sales yet.</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-panel h-100">
            <h2>
              <i className="bi bi-exclamation-triangle text-danger" /> Low Stock Warnings
            </h2>
            {d.lowStockProducts.length === 0 ? (
              <div className="text-center py-5 text-success">
                <i className="bi bi-check-circle fs-3 d-block mb-1" />
                All inventory items are above minimum threshold levels.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm app-table mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Store</th>
                      <th className="text-end">Qty Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.lowStockProducts.slice(0, 7).map((p) => (
                      <tr key={`${p.storeId}-${p.productId}`}>
                        <td className="fw-semibold text-dark">{p.productName}</td>
                        <td><span className="badge bg-light text-dark border">{p.storeCode}</span></td>
                        <td className="text-end">
                          <span className="badge bg-danger-subtle text-danger fw-bold">{p.quantity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="card-panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">
            <i className="bi bi-clock-history text-secondary" /> Recent Billing Transactions
          </h2>
          <Link to="/bills" className="btn btn-sm btn-outline-secondary">
            View All Bills →
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table app-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Customer</th>
                <th>Grand Total</th>
                <th>Paid Amount</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.recentBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">No bills generated today.</td>
                </tr>
              ) : (
                d.recentBills.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/bills/${b.id}`} className="fw-bold text-decoration-none text-primary">
                        {b.billNumber}
                      </Link>
                    </td>
                    <td>{b.customerName || <span className="text-muted fst-italic">Walk-in</span>}</td>
                    <td className="fw-bold">
                      <CurrencyDisplay value={b.grandTotal} />
                    </td>
                    <td>
                      <CurrencyDisplay value={b.paidAmount} />
                    </td>
                    <td className="small text-muted">{formatDateTime(b.billDate)}</td>
                    <td>
                      <span className={`badge ${b.status === 1 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} rounded-pill px-2 py-1`}>
                        {BILL_STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
