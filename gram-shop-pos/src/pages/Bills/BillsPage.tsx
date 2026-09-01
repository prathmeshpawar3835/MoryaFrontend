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
import { deliverWhatsAppShare } from '../../utils/whatsapp'
import { toastApiError } from '../../utils/errors'

export function BillsPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<number | ''>('')
  const [sendingId, setSendingId] = useState<number | null>(null)
  const query = {
    pageNumber: page,
    pageSize: 20,
    search,
    storeId: selectedStoreId ?? undefined,
    fromDate: from || undefined,
    toDate: to || undefined,
    status: status || undefined,
  }
  const q = useQuery({ queryKey: queryKeys.bills(query), queryFn: () => billApi.list(query) })

  return (
    <>
      <PageHeader
        title="Billing History & Invoices"
        subtitle="Search, view, print invoices, and initiate customer returns or exchanges"
        actions={
          <Link to="/pos" className="btn btn-pos-shortcut">
            <i className="bi bi-cash-stack" />
            <span>New POS Bill</span>
          </Link>
        }
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Bill number / customer name / mobile…"
        />
        <StoreSelector />
        <DateRangePicker
          from={from}
          to={to}
          onChange={(a, b) => {
            setFrom(a)
            setTo(b)
            setPage(1)
          }}
        />
        <select
          className="form-select"
          style={{ minWidth: '150px' }}
          value={status}
          onChange={(e) => setStatus(e.target.value ? Number(e.target.value) : '')}
          aria-label="Filter bill status"
        >
          <option value="">All Statuses</option>
          {Object.entries(BILL_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load billing history' : null}
        columns={['Invoice Number', 'Date & Time', 'Customer', 'Store', 'Grand Total', 'Payment Mode', 'Status', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((b) => (
          <tr key={b.id}>
            <td>
              <Link to={`/bills/${b.id}`} className="fw-bold text-navy-900 text-decoration-none">
                {b.billNumber}
              </Link>
            </td>
            <td className="small text-muted">{formatDateTime(b.billDate)}</td>
            <td>
              <div className="fw-semibold text-dark">{b.customerName || <span className="text-muted fst-italic">Walk-in</span>}</div>
              {b.customerMobile ? <div className="small text-muted font-monospace">{b.customerMobile}</div> : null}
              {b.customerCode ? <div className="small text-muted font-monospace">Code {b.customerCode}</div> : null}
              {b.customerReferralCode ? <div className="small text-muted">Referral {b.customerReferralCode}</div> : null}
            </td>
            <td>
              <span className="badge bg-light text-dark border">{b.storeCode}</span>
            </td>
            <td className="fw-bold text-navy-900">
              <CurrencyDisplay value={b.grandTotal} />
            </td>
            <td>
              <div className="d-flex flex-wrap gap-1">
                {b.payments.map((p) => (
                  <span key={p.id} className="badge bg-light text-dark border small">
                    {PAYMENT_LABELS[p.paymentMode] ?? p.paymentMode}
                  </span>
                ))}
              </div>
            </td>
            <td>
              <span className={`badge ${b.status === 1 ? 'bg-success-subtle text-success' : b.status === 4 ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'} rounded-pill px-2 py-1`}>
                {BILL_STATUS_LABELS[b.status] ?? b.status}
              </span>
            </td>
            <td>
              <div className="d-flex gap-1 flex-wrap">
                <Link className="btn btn-sm btn-outline-secondary" to={`/bills/${b.id}`} title="View Invoice">
                  <i className="bi bi-eye me-1" /> View
                </Link>
                {b.status !== BillStatus.Cancelled && b.customerMobile ? (
                  <button
                    className="btn btn-sm btn-success"
                    type="button"
                    disabled={sendingId === b.id}
                    title="Send invoice PDF on WhatsApp"
                    onClick={async () => {
                      setSendingId(b.id)
                      try {
                        await deliverWhatsAppShare(await billApi.sendWhatsApp(b.id), () => billApi.invoicePdf(b.id))
                      } catch (err) {
                        toastApiError(err, 'WhatsApp PDF sending failed')
                      } finally {
                        setSendingId(null)
                      }
                    }}
                  >
                    <i className="bi bi-whatsapp me-1" /> {sendingId === b.id ? 'Sending…' : 'WhatsApp'}
                  </button>
                ) : null}
                {b.status !== BillStatus.Cancelled ? (
                  <>
                    <Link className="btn btn-sm btn-outline-secondary" to={`/returns/new?billId=${b.id}`} title="Initiate Return">
                      Return
                    </Link>
                    <Link className="btn btn-sm btn-outline-secondary" to={`/returns/exchange?billId=${b.id}`} title="Initiate Exchange">
                      Exchange
                    </Link>
                  </>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
