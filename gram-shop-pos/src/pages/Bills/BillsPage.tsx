import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { billApi } from '../../api/billApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, DateRangePicker, CurrencyDisplay } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { formatDateTime } from '../../utils/format'
import { BILL_STATUS_LABELS, PAYMENT_LABELS } from '../../constants/labels'
import { BillStatus } from '../../types'

export function BillsPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<number | ''>('')
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined, fromDate: from || undefined, toDate: to || undefined, status: status || undefined }
  const q = useQuery({ queryKey: queryKeys.bills(query), queryFn: () => billApi.list(query) })

  return (
    <>
      <PageHeader title="Bills" subtitle="Completed and credit invoices" />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Bill number / customer / mobile" />
        <StoreSelector />
        <DateRangePicker from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); setPage(1) }} />
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value ? Number(e.target.value) : '')} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(BILL_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load bills' : null} columns={['Bill', 'Date', 'Customer', 'Store', 'Amount', 'Payment', 'Status', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((b) => (
          <tr key={b.id}>
            <td>{b.billNumber}</td>
            <td>{formatDateTime(b.billDate)}</td>
            <td>{b.customerName || 'Walk-in'}<div className="small text-muted">{b.customerMobile}</div></td>
            <td>{b.storeCode}</td>
            <td><CurrencyDisplay value={b.grandTotal} /></td>
            <td>{b.payments.map((p) => PAYMENT_LABELS[p.paymentMode] ?? p.paymentMode).join(', ') || '—'}</td>
            <td>{BILL_STATUS_LABELS[b.status] ?? b.status}</td>
            <td>
              <Link className="btn btn-sm btn-outline-secondary me-1" to={`/bills/${b.id}`}>View</Link>
              {b.status !== BillStatus.Cancelled ? (
                <>
                  <Link className="btn btn-sm btn-outline-secondary me-1" to={`/returns/new?billId=${b.id}`}>Return</Link>
                  <Link className="btn btn-sm btn-outline-secondary" to={`/returns/exchange?billId=${b.id}`}>Exchange</Link>
                </>
              ) : null}
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
