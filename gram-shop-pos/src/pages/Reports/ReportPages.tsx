import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../../api/reportApi'
import { posApi } from '../../api/posApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, DateRangePicker, CurrencyDisplay } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { formatDate, formatDateTime } from '../../utils/format'
import { RETURN_KIND_LABELS, WHATSAPP_STATUS_LABELS } from '../../constants/labels'
import type { ReportQuery } from '../../types'

function useReportQuery() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [period, setPeriod] = useState('custom')
  const [salesPersonId, setSalesPersonId] = useState<number | ''>('')
  const query: ReportQuery = {
    pageNumber: page,
    pageSize: 20,
    search,
    storeId: selectedStoreId ?? undefined,
    fromDate: from || undefined,
    toDate: to || undefined,
    period,
    salesPersonId: salesPersonId || undefined,
  }
  return { query, search, setSearch, page, setPage, from, setFrom, to, setTo, period, setPeriod, salesPersonId, setSalesPersonId, selectedStoreId }
}

function Filters({
  search,
  setSearch,
  from,
  to,
  setRange,
  period,
  setPeriod,
  extra,
}: {
  search: string
  setSearch: (v: string) => void
  from: string
  to: string
  setRange: (a: string, b: string) => void
  period: string
  setPeriod: (v: string) => void
  extra?: ReactNode
}) {
  return (
        <div className="filter-bar">
          <SearchBox value={search} onChange={setSearch} placeholder="Search reports…" />
      <StoreSelector />
      <select
        className="form-select"
        style={{ minWidth: '130px' }}
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        aria-label="Filter report timeframe"
      >
        <option value="daily">Today</option>
        <option value="weekly">This week</option>
        <option value="monthly">This month</option>
        <option value="custom">Custom range</option>
      </select>
      {period === 'custom' ? <DateRangePicker from={from} to={to} onChange={setRange} /> : null}
      {extra}
    </div>
  )
}

export function SalesReportPage() {
  const f = useReportQuery()
  const staff = useQuery({
    queryKey: queryKeys.salesPersons(f.selectedStoreId),
    queryFn: () => posApi.salesPersons(f.selectedStoreId!),
    enabled: Boolean(f.selectedStoreId),
  })
  const q = useQuery({ queryKey: queryKeys.reports('sales', f.query), queryFn: () => reportApi.sales(f.query) })
  const d = q.data

  return (
    <>
      <PageHeader
        title="Sales & Revenue Report"
        subtitle="Comprehensive breakdown of store gross sales, bills, GST, and net margins"
        actions={
          <div className="page-header-actions">
            <button className="btn-ghost" type="button" onClick={() => void reportApi.exportSalesExcel(f.query)}>
              <i className="bi bi-file-earmark-excel" /> Excel
            </button>
            <button className="btn-ghost" type="button" onClick={() => void reportApi.exportSalesPdf(f.query)}>
              <i className="bi bi-file-earmark-pdf" /> PDF
            </button>
          </div>
        }
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
        extra={
          <select
            className="form-select"
            style={{ minWidth: '160px' }}
            value={f.salesPersonId}
            onChange={(e) => f.setSalesPersonId(e.target.value ? Number(e.target.value) : '')}
            aria-label="Filter by sales person"
          >
            <option value="">All sales persons</option>
            {staff.data?.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.fullName}
              </option>
            ))}
          </select>
        }
      />

      {d ? (
        <div className="kpi-grid">
          <div className="kpi kpi-gold">
            <div className="kpi-header">
              <span>Gross Sales</span>
              <div className="kpi-icon"><i className="bi bi-currency-rupee" /></div>
            </div>
            <strong><CurrencyDisplay value={d.totalSales} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header">
              <span>Total Invoices</span>
              <div className="kpi-icon"><i className="bi bi-receipt" /></div>
            </div>
            <strong>{d.billCount}</strong>
          </div>
          <div className="kpi">
            <div className="kpi-header">
              <span>Total Tax (GST)</span>
              <div className="kpi-icon"><i className="bi bi-percent" /></div>
            </div>
            <strong><CurrencyDisplay value={d.tax} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header">
              <span>Net Revenue</span>
              <div className="kpi-icon text-success bg-success-subtle"><i className="bi bi-cash-stack" /></div>
            </div>
            <strong className="text-success"><CurrencyDisplay value={d.netSales} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header"><span>Returns</span></div>
            <strong><CurrencyDisplay value={d.returnAmount ?? 0} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header"><span>Exchanges</span></div>
            <strong><CurrencyDisplay value={d.exchangeAmount ?? 0} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header"><span>Buybacks</span></div>
            <strong><CurrencyDisplay value={d.buybackAmount ?? 0} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header"><span>Credit used</span></div>
            <strong><CurrencyDisplay value={d.creditUsed ?? 0} /></strong>
          </div>
          <div className="kpi">
            <div className="kpi-header"><span>Credit generated</span></div>
            <strong><CurrencyDisplay value={d.creditGenerated ?? 0} /></strong>
          </div>
        </div>
      ) : null}

      <DataTable
        loading={q.isLoading}
        columns={['Bill Number', 'Bill Date', 'Customer Name', 'Sales Person', 'Grand Total', 'Paid Amount']}
        page={d?.bills.pageNumber}
        totalPages={d?.bills.totalPages}
        onPage={f.setPage}
      >
        {d?.bills.items.map((b) => (
          <tr key={b.id}>
            <td className="fw-bold text-navy-900 font-monospace">{b.billNumber}</td>
            <td className="small text-muted">{formatDateTime(b.billDate)}</td>
            <td>{b.customerName || <span className="text-muted fst-italic">Walk-in</span>}</td>
            <td>{b.salesPersonName || '—'}</td>
            <td className="fw-bold"><CurrencyDisplay value={b.grandTotal} /></td>
            <td className="text-success"><CurrencyDisplay value={b.paidAmount} /></td>
          </tr>
        ))}
      </DataTable>

      {d?.paymentBreakdown.length ? (
        <div className="card-panel mt-3">
          <h2><i className="bi bi-pie-chart text-gold" /> Payment Mode Summary</h2>
          <div className="row g-2">
            {d.paymentBreakdown.map((p) => (
              <div key={p.paymentMode} className="col-sm-6 col-md-3">
                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-dark">{p.paymentMode}</span>
                  <strong className="text-navy-900"><CurrencyDisplay value={p.amount} /></strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function ProductSalesReportPage() {
  const f = useReportQuery()
  const [slow, setSlow] = useState(false)
  const query = { ...f.query, slowMoving: slow }
  const q = useQuery({ queryKey: queryKeys.reports('product-sales', query), queryFn: () => reportApi.productSales(query) })

  return (
    <>
      <PageHeader
        title="Product-Wise Sales Velocity"
        subtitle="Track bestsellers and identify slow-moving inventory"
        actions={
          <button className="btn-ghost" type="button" onClick={() => void reportApi.exportProductSalesExcel(f.query)}>
            <i className="bi bi-file-earmark-excel" /> Excel
          </button>
        }
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
        extra={
          <div className="form-check form-switch ms-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="slowCheck"
              checked={slow}
              onChange={(e) => setSlow(e.target.checked)}
            />
            <label className="form-check-label fw-semibold small text-muted" htmlFor="slowCheck">
              Slow Movers
            </label>
          </div>
        }
      />

      <DataTable
        loading={q.isLoading}
        columns={['Product SKU', 'Product Name', 'Quantity Sold', 'Total Revenue Generated']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.productId}>
            <td className="font-monospace fw-bold">{r.productCode}</td>
            <td className="fw-semibold text-navy-900">{r.productName}</td>
            <td>
              <span className="badge bg-light text-dark border fs-6">{r.quantitySold}</span>
            </td>
            <td className="fw-bold text-navy-900"><CurrencyDisplay value={r.revenue} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function InventoryReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('inventory', f.query), queryFn: () => reportApi.inventory(f.query) })

  return (
    <>
      <PageHeader
        title="Inventory Valuation & Stock Status"
        subtitle="Current inventory asset values at purchase cost and retail price"
        actions={
          <div className="page-header-actions">
            <button className="btn-ghost" type="button" onClick={() => void reportApi.exportInventoryExcel(f.query)}>
              <i className="bi bi-file-earmark-excel" /> Excel
            </button>
            <button className="btn-ghost" type="button" onClick={() => void reportApi.exportInventoryPdf(f.query)}>
              <i className="bi bi-file-earmark-pdf" /> PDF
            </button>
          </div>
        }
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Store', 'Product SKU', 'Product Name', 'Current Stock', 'Total Purchase Value', 'Total Selling Value', 'Stock Alert']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={`${r.storeId}-${r.productId}`}>
            <td><span className="badge bg-light text-dark border">{r.storeCode}</span></td>
            <td className="font-monospace">{r.productCode}</td>
            <td className="fw-semibold text-navy-900">{r.productName}</td>
            <td className="fw-bold">{r.quantity}</td>
            <td><CurrencyDisplay value={r.purchaseValue} /></td>
            <td className="fw-bold text-navy-900"><CurrencyDisplay value={r.sellingValue} /></td>
            <td>
              <span className={`badge ${r.isLowStock ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill`}>
                {r.isLowStock ? 'Low Stock' : 'Adequate'}
              </span>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function PurchasesReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('purchases', f.query), queryFn: () => reportApi.purchases(f.query) })

  return (
    <>
      <PageHeader
        title="Supplier Purchases Report"
        subtitle="Historical procurement expenditures and vendor invoices"
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Supplier Invoice', 'Supplier / Vendor', 'Store Branch', 'Purchase Date', 'Total Value']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td className="fw-bold font-monospace">{p.invoiceNumber}</td>
            <td>{p.supplierName}</td>
            <td><span className="badge bg-light text-dark border">{p.storeCode}</span></td>
            <td className="small text-muted">{formatDateTime(p.purchaseDate)}</td>
            <td className="fw-bold text-navy-900"><CurrencyDisplay value={p.total} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function ReturnsReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('returns', f.query), queryFn: () => reportApi.returns(f.query) })

  return (
    <>
      <PageHeader
        title="Returns & Exchanges Report"
        subtitle="Summary of refunded merchandise, exchanges, and return reasons"
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Return Number', 'Original Bill', 'Return Date', 'Refund Amount', 'Return Type']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td className="fw-bold font-monospace text-navy-900">{r.returnNumber}</td>
            <td className="font-monospace text-muted">{r.originalBillNumber}</td>
            <td className="small text-muted">{formatDateTime(r.returnDate)}</td>
            <td className="fw-bold text-danger"><CurrencyDisplay value={r.returnAmount} /></td>
            <td>
              <span className="badge bg-light text-dark border">{RETURN_KIND_LABELS[r.returnKind] ?? r.returnKind}</span>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function CustomerDuesReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('dues', f.query), queryFn: () => reportApi.customerDues(f.query) })

  return (
    <>
      <PageHeader
        title="Customer Dues & Aging Analysis"
        subtitle="Audit outstanding credit and payment recovery aging buckets"
        actions={
          <button className="btn-ghost" type="button" onClick={() => void reportApi.exportCustomersExcel(f.query)}>
            <i className="bi bi-file-earmark-excel" /> Excel
          </button>
        }
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Customer Name', 'Mobile Number', 'Store ID', 'Outstanding Due', 'Lifetime Purchases', 'Aging (Days)']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.customerId}>
            <td className="fw-bold text-navy-900">{r.name}</td>
            <td className="font-monospace">{r.mobile}</td>
            <td><span className="badge bg-light text-dark border">Store #{r.storeId}</span></td>
            <td className="fw-bold text-danger"><CurrencyDisplay value={r.outstandingAmount} /></td>
            <td><CurrencyDisplay value={r.totalPurchases} /></td>
            <td>
              <span className={`badge ${r.agingDays > 30 ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill`}>
                {r.agingDays} days
              </span>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function ReferralReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('referrals', f.query), queryFn: () => reportApi.referrals(f.query) })

  return (
    <>
      <PageHeader
        title="Referral Program Performance"
        subtitle="Analysis of referral program incentives and reward redemptions"
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Referrer', 'Code', 'Referrals', 'Referral Sales', 'Discount Given', 'Pending', 'Credited', 'Redeemed']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.referrerCustomerId}>
            <td className="fw-bold text-navy-900">{r.referrerName}</td>
            <td className="font-monospace small">{r.referrerCode || '—'}</td>
            <td><span className="badge bg-light text-dark border">{r.referralCount}</span></td>
            <td><CurrencyDisplay value={r.referralSales ?? 0} /></td>
            <td><CurrencyDisplay value={r.discountGiven ?? 0} /></td>
            <td><CurrencyDisplay value={r.pendingRewards} /></td>
            <td className="fw-bold text-success"><CurrencyDisplay value={r.creditedRewards} /></td>
            <td><CurrencyDisplay value={r.redeemedRewards} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function BirthdayReportPage() {
  const f = useReportQuery()
  const q = useQuery({
    queryKey: queryKeys.reports('birthdays', { ...f.query, period: f.period || 'daily' }),
    queryFn: () => reportApi.birthdays({ ...f.query, period: f.period || 'daily' }),
  })

  return (
    <>
      <PageHeader
        title="Birthday Customer Report"
        subtitle="Today's birthday customers, WhatsApp status, and offer redemptions"
      />
      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />
      <DataTable
        loading={q.isLoading}
        columns={['Customer Name', 'Mobile', 'Birthday', 'Store', 'Birthday Offer', 'WhatsApp', 'Redeemed', 'Invoice', 'Discount']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.customerId}>
            <td className="fw-bold text-navy-900">{r.customerName}</td>
            <td className="font-monospace">{r.mobileNumber}</td>
            <td>{formatDate(r.dateOfBirth)}</td>
            <td>{r.storeName}</td>
            <td>{r.birthdayOffer || '—'}</td>
            <td>{r.whatsAppStatus ? WHATSAPP_STATUS_LABELS[r.whatsAppStatus] ?? r.whatsAppStatus : '—'}</td>
            <td>{r.redeemed ? 'Redeemed' : 'Not redeemed'}</td>
            <td className="font-monospace">{r.invoiceNumber || '—'}</td>
            <td><CurrencyDisplay value={r.discountAmount} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function ProfitReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('profit', f.query), queryFn: () => reportApi.profit(f.query) })

  return (
    <>
      <PageHeader
        title="Profit & Margin Analysis (Admin Only)"
        subtitle="Gross margins calculated against historical weighted purchase costs"
      />

      <Filters
        search={f.search}
        setSearch={f.setSearch}
        from={f.from}
        to={f.to}
        setRange={(a, b) => {
          f.setFrom(a)
          f.setTo(b)
        }}
        period={f.period}
        setPeriod={f.setPeriod}
      />

      <DataTable
        loading={q.isLoading}
        columns={['Bill Number', 'Date', 'Product SKU / Name', 'Qty', 'Selling Amount', 'Historical Cost', 'Discount', 'Net Profit']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={f.setPage}
      >
        {q.data?.items.map((r, i) => (
          <tr key={`${r.billNumber}-${r.productCode}-${i}`}>
            <td className="font-monospace fw-bold">{r.billNumber}</td>
            <td className="small text-muted">{formatDateTime(r.billDate)}</td>
            <td>
              <div className="fw-semibold text-navy-900">{r.productName}</div>
              <div className="small text-muted font-monospace">{r.productCode}</div>
            </td>
            <td>{r.quantity}</td>
            <td><CurrencyDisplay value={r.sellingAmount} /></td>
            <td className="text-muted"><CurrencyDisplay value={r.historicalPurchaseAmount} /></td>
            <td className="text-danger">{r.discount ? <CurrencyDisplay value={r.discount} /> : '—'}</td>
            <td className="fw-bold text-success"><CurrencyDisplay value={r.profit} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
