import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../../api/reportApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, DateRangePicker, CurrencyDisplay } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { formatDateTime } from '../../utils/format'
import { RETURN_KIND_LABELS } from '../../constants/labels'
import type { ReportQuery } from '../../types'

function useReportQuery() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [period, setPeriod] = useState('custom')
  const query: ReportQuery = {
    pageNumber: page,
    pageSize: 20,
    search,
    storeId: selectedStoreId ?? undefined,
    fromDate: from || undefined,
    toDate: to || undefined,
    period,
  }
  return { query, search, setSearch, page, setPage, from, setFrom, to, setTo, period, setPeriod }
}

function Filters({
  search, setSearch, from, to, setRange, period, setPeriod, extra,
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
      <SearchBox value={search} onChange={setSearch} />
      <StoreSelector />
      <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="custom">Custom</option>
      </select>
      {period === 'custom' ? <DateRangePicker from={from} to={to} onChange={setRange} /> : null}
      {extra}
    </div>
  )
}

export function SalesReportPage() {
  const f = useReportQuery()
  const q = useQuery({ queryKey: queryKeys.reports('sales', f.query), queryFn: () => reportApi.sales(f.query) })
  const d = q.data
  return (
    <>
      <PageHeader title="Sales report" actions={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportSalesExcel(f.query)}>Excel</button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportSalesPdf(f.query)}>PDF</button>
        </>
      } />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      {d ? (
        <div className="kpi-grid">
          <div className="kpi"><span>Total sales</span><strong><CurrencyDisplay value={d.totalSales} /></strong></div>
          <div className="kpi"><span>Bills</span><strong>{d.billCount}</strong></div>
          <div className="kpi"><span>Tax</span><strong><CurrencyDisplay value={d.tax} /></strong></div>
          <div className="kpi"><span>Net</span><strong><CurrencyDisplay value={d.netSales} /></strong></div>
        </div>
      ) : null}
      <DataTable loading={q.isLoading} columns={['Bill', 'Date', 'Customer', 'Total', 'Paid']} page={d?.bills.pageNumber} totalPages={d?.bills.totalPages} onPage={f.setPage}>
        {d?.bills.items.map((b) => (
          <tr key={b.id}>
            <td>{b.billNumber}</td>
            <td>{formatDateTime(b.billDate)}</td>
            <td>{b.customerName || 'Walk-in'}</td>
            <td><CurrencyDisplay value={b.grandTotal} /></td>
            <td><CurrencyDisplay value={b.paidAmount} /></td>
          </tr>
        ))}
      </DataTable>
      {d?.paymentBreakdown.length ? (
        <div className="card-panel mt-3">
          {d.paymentBreakdown.map((p) => (
            <div key={p.paymentMode} className="d-flex justify-content-between">
              <span>{p.paymentMode}</span>
              <CurrencyDisplay value={p.amount} />
            </div>
          ))}
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
      <PageHeader title="Product sales" actions={<button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportProductSalesExcel(f.query)}>Excel</button>} />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} extra={<label className="form-check"><input type="checkbox" className="form-check-input" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Slow movers</label>} />
      <DataTable loading={q.isLoading} columns={['Code', 'Product', 'Qty', 'Revenue']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.productId}>
            <td>{r.productCode}</td>
            <td>{r.productName}</td>
            <td>{r.quantitySold}</td>
            <td><CurrencyDisplay value={r.revenue} /></td>
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
      <PageHeader title="Inventory report" actions={
        <>
          <button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportInventoryExcel(f.query)}>Excel</button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportInventoryPdf(f.query)}>PDF</button>
        </>
      } />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Store', 'Code', 'Product', 'Qty', 'Purchase value', 'Selling value', 'Low']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r) => (
          <tr key={`${r.storeId}-${r.productId}`}>
            <td>{r.storeCode}</td>
            <td>{r.productCode}</td>
            <td>{r.productName}</td>
            <td>{r.quantity}</td>
            <td><CurrencyDisplay value={r.purchaseValue} /></td>
            <td><CurrencyDisplay value={r.sellingValue} /></td>
            <td>{r.isLowStock ? 'Yes' : 'No'}</td>
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
      <PageHeader title="Purchase report" />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Invoice', 'Supplier', 'Store', 'Date', 'Value']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td>{p.invoiceNumber}</td>
            <td>{p.supplierName}</td>
            <td>{p.storeCode}</td>
            <td>{formatDateTime(p.purchaseDate)}</td>
            <td><CurrencyDisplay value={p.total} /></td>
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
      <PageHeader title="Return report" />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Return', 'Bill', 'Date', 'Amount', 'Kind']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td>{r.returnNumber}</td>
            <td>{r.originalBillNumber}</td>
            <td>{formatDateTime(r.returnDate)}</td>
            <td><CurrencyDisplay value={r.returnAmount} /></td>
            <td>{RETURN_KIND_LABELS[r.returnKind] ?? r.returnKind}</td>
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
      <PageHeader title="Customer dues report" actions={<button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportCustomersExcel(f.query)}>Excel</button>} />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Customer', 'Mobile', 'Store', 'Due', 'Purchases', 'Aging']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.customerId}>
            <td>{r.name}</td>
            <td>{r.mobile}</td>
            <td>{r.storeId}</td>
            <td><CurrencyDisplay value={r.outstandingAmount} /></td>
            <td><CurrencyDisplay value={r.totalPurchases} /></td>
            <td>{r.agingDays}</td>
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
      <PageHeader title="Referral report" />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Referrer', 'Count', 'Pending', 'Credited', 'Redeemed']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.referrerCustomerId}>
            <td>{r.referrerName}</td>
            <td>{r.referralCount}</td>
            <td><CurrencyDisplay value={r.pendingRewards} /></td>
            <td><CurrencyDisplay value={r.creditedRewards} /></td>
            <td><CurrencyDisplay value={r.redeemedRewards} /></td>
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
      <PageHeader title="Profit report" subtitle="Admin only · historical purchase cost" />
      <Filters search={f.search} setSearch={f.setSearch} from={f.from} to={f.to} setRange={(a, b) => { f.setFrom(a); f.setTo(b) }} period={f.period} setPeriod={f.setPeriod} />
      <DataTable loading={q.isLoading} columns={['Bill', 'Date', 'Product', 'Qty', 'Selling', 'Cost', 'Discount', 'Profit']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={f.setPage}>
        {q.data?.items.map((r, i) => (
          <tr key={`${r.billNumber}-${r.productCode}-${i}`}>
            <td>{r.billNumber}</td>
            <td>{formatDateTime(r.billDate)}</td>
            <td>{r.productName}</td>
            <td>{r.quantity}</td>
            <td><CurrencyDisplay value={r.sellingAmount} /></td>
            <td><CurrencyDisplay value={r.historicalPurchaseAmount} /></td>
            <td><CurrencyDisplay value={r.discount} /></td>
            <td><CurrencyDisplay value={r.profit} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
