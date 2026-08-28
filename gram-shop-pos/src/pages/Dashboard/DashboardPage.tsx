import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, ErrorState, PageLoader, CurrencyDisplay } from '../../components/common/Feedback'
import { formatDateTime } from '../../utils/format'
import { BILL_STATUS_LABELS } from '../../constants/labels'
import { canAccess } from '../../constants/permissions'

const COLORS = ['#121b32', '#d4af4a', '#2f6f8f', '#8f6a1d', '#1f8a5b']
const CHART = { grid: '#eee8dc', axis: '#8a8478', tooltip: { borderRadius: 14, border: '1px solid #e6e1d4', boxShadow: '0 12px 28px rgba(18,27,50,0.1)', fontFamily: 'Manrope, sans-serif' } }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

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
  const firstName = (user?.fullName || user?.userName || 'there').split(' ')[0]
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-pos-shortcut" to="/pos">
              <i className="bi bi-lightning-charge-fill" />
              <span>New sale</span>
            </Link>
            {canAccess(user?.role, 'products.write') ? (
              <Link className="btn btn-ghost" to="/products/create">
                <i className="bi bi-plus-lg" /> Product
              </Link>
            ) : null}
            <Link className="btn btn-ghost" to="/customers">
              <i className="bi bi-person-plus" /> Customer
            </Link>
            <Link className="btn btn-ghost" to="/reports/sales">
              <i className="bi bi-graph-up" /> Reports
            </Link>
          </div>
        }
      />

      <div className="kpi-grid">
        <div className="kpi kpi-gold">
          <div className="kpi-header">
            <span>Today's sales</span>
            <div className="kpi-icon"><i className="bi bi-currency-rupee" /></div>
          </div>
          <strong><CurrencyDisplay value={d.todaySales} /></strong>
          <small>{d.todayBills} bills · {d.todayCustomers} customers</small>
        </div>
        <div className="kpi kpi-navy">
          <div className="kpi-header">
            <span>Monthly sales</span>
            <div className="kpi-icon"><i className="bi bi-calendar3" /></div>
          </div>
          <strong><CurrencyDisplay value={d.monthlySales ?? 0} /></strong>
          <small>{d.monthlyBills ?? 0} bills this month</small>
        </div>
        <div className="kpi kpi-warn">
          <div className="kpi-header">
            <span>Pending dues</span>
            <div className="kpi-icon"><i className="bi bi-wallet2" /></div>
          </div>
          <strong><CurrencyDisplay value={d.pendingDues} /></strong>
          <small>Udhaar outstanding</small>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Avg bill</span>
            <div className="kpi-icon"><i className="bi bi-receipt" /></div>
          </div>
          <strong><CurrencyDisplay value={d.averageBillValue ?? 0} /></strong>
          <small>{d.totalCustomers ?? 0} customers</small>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-compact">
        <div className="kpi">
          <div className="kpi-header"><span>Returns</span><div className="kpi-icon"><i className="bi bi-arrow-return-left" /></div></div>
          <strong><CurrencyDisplay value={d.todayReturns ?? 0} /></strong>
          <small>{d.todayReturnCount ?? 0} today · month <CurrencyDisplay value={d.monthlyReturns ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Exchanges</span><div className="kpi-icon"><i className="bi bi-arrow-left-right" /></div></div>
          <strong><CurrencyDisplay value={d.todayExchanges ?? 0} /></strong>
          <small>{d.todayExchangeCount ?? 0} today · month <CurrencyDisplay value={d.monthlyExchanges ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Buybacks</span><div className="kpi-icon"><i className="bi bi-bag-check" /></div></div>
          <strong><CurrencyDisplay value={d.todayBuybacks ?? 0} /></strong>
          <small>{d.todayBuybackCount ?? 0} today · month <CurrencyDisplay value={d.monthlyBuybacks ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Inventory</span><div className="kpi-icon"><i className="bi bi-box-seam" /></div></div>
          <strong>{d.totalInventoryQuantity ?? 0}</strong>
          <small>{d.totalInventoryProducts ?? 0} SKUs · {d.lowStockCount ?? 0} low</small>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-compact">
        <div className="kpi">
          <div className="kpi-header"><span>Today's referrals</span><div className="kpi-icon"><i className="bi bi-gift" /></div></div>
          <strong>{d.todayReferralCount ?? 0}</strong>
          <small>Sales <CurrencyDisplay value={d.todayReferralSales ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Today's referral cost</span><div className="kpi-icon"><i className="bi bi-wallet" /></div></div>
          <strong><CurrencyDisplay value={d.todayReferralCost ?? 0} /></strong>
          <small>Discount <CurrencyDisplay value={d.todayReferralDiscount ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Monthly referrals</span><div className="kpi-icon"><i className="bi bi-calendar-heart" /></div></div>
          <strong>{d.monthlyReferralCount ?? 0}</strong>
          <small>Sales <CurrencyDisplay value={d.monthlyReferralSales ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Total referral cost</span><div className="kpi-icon"><i className="bi bi-cash-stack" /></div></div>
          <strong><CurrencyDisplay value={d.totalReferralCost ?? 0} /></strong>
          <small>Month <CurrencyDisplay value={d.monthlyReferralCost ?? 0} /></small>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-compact">
        <div className="kpi kpi-gold">
          <div className="kpi-header"><span>Today's birthdays</span><div className="kpi-icon"><i className="bi bi-cake2" /></div></div>
          <strong>{d.todayBirthdayCustomers ?? 0}</strong>
          <small>WhatsApp sent {d.todayBirthdayMessagesSent ?? 0} · failed {d.todayBirthdayMessagesFailed ?? 0}</small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Birthday offers redeemed</span><div className="kpi-icon"><i className="bi bi-stars" /></div></div>
          <strong>{d.todayBirthdayOffersRedeemed ?? 0}</strong>
          <small>Discount <CurrencyDisplay value={d.todayBirthdayDiscount ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Monthly birthday redemptions</span><div className="kpi-icon"><i className="bi bi-calendar3" /></div></div>
          <strong>{d.monthlyBirthdayOffersRedeemed ?? 0}</strong>
          <small>Cost <CurrencyDisplay value={d.monthlyBirthdayDiscount ?? 0} /></small>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Birthday report</span><div className="kpi-icon"><i className="bi bi-bar-chart" /></div></div>
          <strong><Link to="/reports/birthdays" className="text-decoration-none">Open report</Link></strong>
          <small>Customers, WhatsApp, redemptions</small>
        </div>
      </div>

      {/* Charts Section */}
      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <div className="card-panel chart-card h-100">
            <h2>
              <i className="bi bi-graph-up" /> Sales trend
            </h2>
            {d.salesChartData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={d.salesChartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af4a" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#d4af4a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5, 10)} stroke={CHART.axis} fontSize={12} />
                  <YAxis stroke={CHART.axis} fontSize={12} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']} contentStyle={CHART.tooltip} />
                  <Area type="monotone" dataKey="sales" stroke="#b8892a" strokeWidth={2.8} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No sales recorded in this period.</div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-panel chart-card h-100">
            <h2>
              <i className="bi bi-pie-chart" /> Payment modes
            </h2>
            {d.paymentModeSummary.length ? (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={d.paymentModeSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="paymentMode" stroke={CHART.axis} fontSize={12} />
                  <YAxis stroke={CHART.axis} fontSize={12} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={CHART.tooltip}
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
                  <XAxis type="number" stroke={CHART.axis} fontSize={12} />
                  <YAxis type="category" dataKey="productName" width={130} stroke={CHART.axis} fontSize={12} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={CHART.tooltip} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#121b32" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No product sales yet.</div>
            )}
          </div>
        </div>

        {d.referralChartData?.length ? (
          <div className="col-lg-6">
            <div className="card-panel h-100">
              <h2>
                <i className="bi bi-gift text-warning" /> Referral Trend
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={d.referralChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5, 10)} stroke={CHART.axis} fontSize={12} />
                  <YAxis stroke={CHART.axis} fontSize={12} />
                  <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Referral sales']} contentStyle={CHART.tooltip} />
                  <Line type="monotone" dataKey="sales" stroke="#1b2744" strokeWidth={3} dot={{ r: 3, fill: '#d4af4a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {d.exchangeReturnChart?.length ? (
          <div className="col-lg-6">
            <div className="card-panel h-100">
              <h2>
                <i className="bi bi-arrow-left-right text-primary" /> Exchange vs Return
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={d.exchangeReturnChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5, 10)} stroke={CHART.axis} fontSize={12} />
                  <YAxis stroke={CHART.axis} fontSize={12} />
                  <Tooltip contentStyle={CHART.tooltip} />
                  <Legend />
                  <Bar dataKey="exchangeAmount" name="Exchange" fill="#d4af4a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="returnAmount" name="Return" fill="#243456" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {d.topReferrers?.length ? (
          <div className="col-lg-6">
            <div className="card-panel h-100">
              <h2>
                <i className="bi bi-people text-warning" /> Top Referrers
              </h2>
              <div className="table-responsive">
                <table className="table table-sm app-table mb-0">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Code</th>
                      <th>Count</th>
                      <th className="text-end">Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.topReferrers.slice(0, 7).map((r) => (
                      <tr key={r.customerId}>
                        <td className="fw-semibold">{r.customerName}</td>
                        <td className="font-monospace small">{r.customerCode}</td>
                        <td>{r.referralCount}</td>
                        <td className="text-end"><CurrencyDisplay value={r.benefitEarned} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

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

      <div className="card-panel">
        <div className="card-panel-head">
          <h2 className="mb-0"><i className="bi bi-receipt" /> Recent bills</h2>
          <Link to="/bills" className="btn-ghost">View all</Link>
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
                      <Link to={`/bills/${b.id}`} className="fw-bold text-decoration-none text-navy-900">
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
