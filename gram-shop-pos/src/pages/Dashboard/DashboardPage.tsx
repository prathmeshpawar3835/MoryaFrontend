import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, ErrorState, PageLoader } from '../../components/common/Feedback'
import { CurrencyDisplay } from '../../components/common/Feedback'
import { formatDateTime } from '../../utils/format'
import { BILL_STATUS_LABELS } from '../../constants/labels'
import { canAccess } from '../../constants/permissions'

const COLORS = ['#0f2744', '#c9a227', '#17375c', '#6b7280', '#157347']

export function DashboardPage() {
  const { selectedStoreId } = useStore()
  const { user } = useAuth()
  const q = useQuery({
    queryKey: queryKeys.dashboard(selectedStoreId),
    queryFn: () => dashboardApi.get(selectedStoreId),
  })

  if (q.isLoading) return <PageLoader label="Loading dashboard…" />
  if (q.isError || !q.data) return <ErrorState message="Could not load dashboard." />

  const d = q.data
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live figures from the POS API"
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-gold" to="/pos">
              New bill
            </Link>
            {canAccess(user?.role, 'products.write') ? (
              <Link className="btn btn-outline-secondary" to="/products/create">
                Add product
              </Link>
            ) : null}
            <Link className="btn btn-outline-secondary" to="/customers">
              Add customer
            </Link>
            <Link className="btn btn-outline-secondary" to="/inventory/stock-in">
              Stock in
            </Link>
            <Link className="btn btn-outline-secondary" to="/reports/sales">
              Reports
            </Link>
          </div>
        }
      />
      <div className="kpi-grid">
        <div className="kpi">
          <span>Today's sales</span>
          <strong>
            <CurrencyDisplay value={d.todaySales} />
          </strong>
        </div>
        <div className="kpi">
          <span>Today's bills</span>
          <strong>{d.todayBills}</strong>
        </div>
        <div className="kpi">
          <span>Today's customers</span>
          <strong>{d.todayCustomers}</strong>
        </div>
        <div className="kpi">
          <span>Pending dues</span>
          <strong>
            <CurrencyDisplay value={d.pendingDues} />
          </strong>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card-panel">
            <h2>Sales trend</h2>
            {d.salesChartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={d.salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5, 10)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#c9a227" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted mb-0">No sales in this period.</p>
            )}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card-panel">
            <h2>Payment modes</h2>
            {d.paymentModeSummary.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d.paymentModeSummary}>
                  <XAxis dataKey="paymentMode" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount">
                    {d.paymentModeSummary.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted mb-0">No payments yet.</p>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-panel">
            <h2>Top products</h2>
            {d.topSellingProducts.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.topSellingProducts} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="productName" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0f2744" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted mb-0">No product sales yet.</p>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-panel">
            <h2>Low stock</h2>
            <ul className="list-unstyled mb-0">
              {d.lowStockProducts.length === 0 ? <li className="text-muted">No low-stock items.</li> : null}
              {d.lowStockProducts.slice(0, 8).map((p) => (
                <li key={`${p.storeId}-${p.productId}`} className="d-flex justify-content-between py-1 border-bottom">
                  <span>
                    {p.productName} <small className="text-muted">({p.storeCode})</small>
                  </span>
                  <strong>{p.quantity}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="card-panel mt-3">
        <h2>Recent bills</h2>
        <div className="table-responsive">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.recentBills.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link to={`/bills/${b.id}`}>{b.billNumber}</Link>
                  </td>
                  <td>{b.customerName || 'Walk-in'}</td>
                  <td>
                    <CurrencyDisplay value={b.grandTotal} />
                  </td>
                  <td>
                    <CurrencyDisplay value={b.paidAmount} />
                  </td>
                  <td>{formatDateTime(b.billDate)}</td>
                  <td>{BILL_STATUS_LABELS[b.status] ?? b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
