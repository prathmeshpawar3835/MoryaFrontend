import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customerApi'
import { referralApi } from '../../api/referralApi'
import { reportApi } from '../../api/reportApi'
import { queryKeys } from '../../api/queryKeys'
import { customerSchema } from '../../validators/schemas'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, CurrencyDisplay, StatusBadge } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { Modal } from '../../components/common/Modal'
import { FormField } from '../../components/common/FormField'
import { formatDateTime, formatMoney } from '../../utils/format'
import { ledgerSides } from '../../utils/ledger'
import { toastApiError } from '../../utils/errors'
import { LEDGER_TYPE_LABELS, PAYMENT_LABELS, REFERRAL_STATUS_LABELS } from '../../constants/labels'
import { PaymentMode } from '../../types'
import type { z } from 'zod'
import { ReceiptView } from '../../components/print/ReceiptView'

type Form = z.infer<typeof customerSchema>

export function CustomersPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.customers(query), queryFn: () => customerApi.list(query) })
  const form = useForm<Form>({
    resolver: zodResolver(customerSchema) as Resolver<Form>,
    mode: 'onTouched',
    defaultValues: {
      storeId: selectedStoreId ?? stores[0]?.storeId ?? 0,
      name: '',
      mobileNumber: '',
      address: '',
      referralCode: '',
      referringMobileNumber: '',
      dateOfBirth: '',
    },
  })

  const create = useMutation({
    mutationFn: (v: Form) =>
      customerApi.create({
        storeId: v.storeId,
        name: v.name,
        mobileNumber: v.mobileNumber,
        address: v.address,
        referralCode: v.referralCode,
        referringMobileNumber: v.referringMobileNumber,
        dateOfBirth: v.dateOfBirth || undefined,
      }),
    onSuccess: async () => {
      toast.success('Customer registered successfully')
      setOpen(false)
      form.reset()
      await qc.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to create customer')
    },
  })

  return (
    <>
      <PageHeader
        title="Customer Directory & CRM"
        subtitle="Manage customer profiles, store ledgers, pending dues, and wallet reward balances"
        actions={
          <button className="btn btn-gold" type="button" onClick={() => setOpen(true)}>
            <i className="bi bi-person-plus me-1" /> Add Customer
          </button>
        }
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search by name, mobile, or customer code…"
        />
        <StoreSelector />
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load customer records' : null}
        columns={['ID', 'Customer Name', 'Code', 'Mobile Number', 'Home Store', 'Referral Code', 'Pending Due', 'Wallet Balance', 'Status', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((c) => (
          <tr key={c.id}>
            <td className="small text-muted font-monospace">#{c.id}</td>
            <td>
              <Link to={`/customers/${c.id}`} className="fw-bold text-navy-900 text-decoration-none">
                {c.name}
              </Link>
            </td>
            <td>
              <span className="badge bg-navy text-white font-monospace">{c.customerCode || '—'}</span>
            </td>
            <td>
              <span className="font-monospace">{c.mobileNumber}</span>
            </td>
            <td>
              <span className="badge bg-light text-dark border">{c.storeName}</span>
            </td>
            <td>
              {c.referralCode ? (
                <span className="badge bg-warning-subtle text-dark border border-warning-subtle font-monospace">
                  {c.referralCode}
                </span>
              ) : (
                <span className="text-muted small">—</span>
              )}
            </td>
            <td>
              {(() => {
                const sides = ledgerSides(c.outstandingBalance, c.totalDebit ?? 0, c.totalCredit ?? 0)
                if (sides.overdue > 0) {
                  return (
                    <span className="text-danger fw-bold">
                      Overdue <CurrencyDisplay value={sides.overdue} />
                    </span>
                  )
                }
                if (sides.advance > 0) {
                  return (
                    <span className="text-success fw-semibold">
                      Credit <CurrencyDisplay value={sides.advance} />
                    </span>
                  )
                }
                return <span className="text-muted"><CurrencyDisplay value={0} /></span>
              })()}
            </td>
            <td>
              <span className="text-success fw-semibold">
                <CurrencyDisplay value={c.walletBalance} />
              </span>
            </td>
            <td>
              <StatusBadge active={c.isActive} />
            </td>
            <td>
              <div className="d-flex gap-1">
                <Link className="btn btn-sm btn-outline-secondary" to={`/customers/${c.id}`} title="View Profile">
                  <i className="bi bi-person me-1" /> Profile
                </Link>
                <Link className="btn btn-sm btn-outline-secondary" to={`/customers/${c.id}/ledger`} title="View Ledger">
                  <i className="bi bi-journal-text me-1" /> Ledger
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add Customer Modal with Validation */}
      <Modal open={open} title="Register New Customer" onClose={() => { setOpen(false); form.reset() }}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
          <FormField
            label="Assigned Store Branch"
            required
            error={form.formState.errors.storeId?.message}
          >
            <select
              className={`form-select ${form.formState.errors.storeId ? 'is-invalid' : ''}`}
              {...form.register('storeId', { valueAsNumber: true })}
            >
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Customer Full Name"
            required
            error={form.formState.errors.name?.message}
          >
            <input
              className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Ramesh Patil"
              {...form.register('name')}
            />
          </FormField>

          <FormField
            label="Mobile Number (10 Digits)"
            required
            hint="Required for billing, SMS receipts, and referral rewards."
            error={form.formState.errors.mobileNumber?.message}
          >
            <div className="input-group">
              <span className="input-group-text bg-light text-muted">+91</span>
              <input
                className={`form-control ${form.formState.errors.mobileNumber ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number"
                maxLength={10}
                {...form.register('mobileNumber')}
              />
            </div>
          </FormField>

          <FormField
            label="Address / City (Optional)"
            error={form.formState.errors.address?.message}
          >
            <textarea
              className="form-control"
              rows={2}
              placeholder="Street address or city name"
              {...form.register('address')}
            />
          </FormField>

          <FormField label="Date of birth (birthday offer)">
            <input className="form-control" type="date" max={new Date().toISOString().slice(0, 10)} {...form.register('dateOfBirth')} />
          </FormField>

          <div className="row g-2">
            <div className="col-6">
              <FormField
                label="Referral Code Used"
                error={form.formState.errors.referralCode?.message}
              >
                <input
                  className="form-control form-control-sm"
                  placeholder="Optional code"
                  {...form.register('referralCode')}
                />
              </FormField>
            </div>
            <div className="col-6">
              <FormField
                label="Referring Mobile"
                error={form.formState.errors.referringMobileNumber?.message}
              >
                <input
                  className="form-control form-control-sm"
                  placeholder="Optional mobile"
                  maxLength={10}
                  {...form.register('referringMobileNumber')}
                />
              </FormField>
            </div>
          </div>

          <div className="app-modal-actions">
            <button
              type="button"
              className="btn btn-light border px-3"
              onClick={() => { setOpen(false); form.reset() }}
            >
              Cancel
            </button>
            <button
              className="btn btn-gold px-4 fw-bold"
              type="submit"
              disabled={create.isPending}
            >
              {create.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function CustomerProfilePage() {
  const { id } = useParams()
  const customerId = Number(id)
  const [tab, setTab] = useState('info')
  const customer = useQuery({ queryKey: queryKeys.customer(customerId), queryFn: () => customerApi.get(customerId) })
  const history = useQuery({ queryKey: queryKeys.customerHistory(customerId), queryFn: () => customerApi.history(customerId) })
  const wallet = useQuery({ queryKey: queryKeys.customerWallet(customerId), queryFn: () => customerApi.wallet(customerId) })
  const c = customer.data
  const sides = ledgerSides(c?.outstandingBalance ?? 0, c?.totalDebit ?? 0, c?.totalCredit ?? 0)

  if (!c) return <PageHeader title="Customer Profile" />

  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={`Code ${c.customerCode || '—'} · Referral ${c.referralCode || '—'} · Mobile: ${c.mobileNumber}`}
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-gold" to={`/customers/${c.id}/ledger`}>
              <i className="bi bi-journal-text me-1" /> View Account Ledger
            </Link>
            <Link className="btn btn-outline-secondary" to="/customers">
              <i className="bi bi-arrow-left me-1" /> All Customers
            </Link>
          </div>
        }
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-header">
            <span>Ledger Debit</span>
            <div className="kpi-icon text-danger bg-danger-subtle"><i className="bi bi-arrow-up-right" /></div>
          </div>
          <strong className="text-danger">
            <CurrencyDisplay value={c.totalDebit ?? 0} />
          </strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Ledger Credit</span>
            <div className="kpi-icon text-success bg-success-subtle"><i className="bi bi-arrow-down-left" /></div>
          </div>
          <strong className="text-success">
            <CurrencyDisplay value={c.totalCredit ?? 0} />
          </strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>{sides.overdue > 0 ? 'Overdue' : 'Credit Balance'}</span>
            <div className="kpi-icon text-navy-900 bg-light"><i className="bi bi-wallet2" /></div>
          </div>
          <strong className={sides.overdue > 0 ? 'text-danger' : 'text-success'}>
            <CurrencyDisplay value={Math.max(sides.overdue, sides.advance)} />
          </strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Reward Wallet</span>
            <div className="kpi-icon text-success bg-success-subtle"><i className="bi bi-cash-coin" /></div>
          </div>
          <strong className="text-success">
            <CurrencyDisplay value={wallet.data?.balance ?? c.walletBalance} />
          </strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Customer Code</span>
            <div className="kpi-icon text-navy-900 bg-light"><i className="bi bi-hash" /></div>
          </div>
          <strong className="font-monospace">{c.customerCode || '—'}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header">
            <span>Referral Code</span>
            <div className="kpi-icon text-warning bg-warning-subtle"><i className="bi bi-share" /></div>
          </div>
          <strong className="font-monospace">{c.referralCode || '—'}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="btn-group mb-3 shadow-xs">
        {[
          { key: 'info', label: 'Customer Information', icon: 'bi-info-circle' },
          { key: 'bills', label: 'Billing Invoices', icon: 'bi-receipt' },
          { key: 'returns', label: 'Return Records', icon: 'bi-arrow-repeat' },
          { key: 'wallet', label: 'Wallet Ledger', icon: 'bi-cash-coin' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${tab === t.key ? 'btn-gold' : 'btn-light border'}`}
            onClick={() => setTab(t.key)}
          >
            <i className={`bi ${t.icon} me-1`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="card-panel">
          <h2><i className="bi bi-person-lines-fill text-gold" /> Personal & Store Details</h2>
          <table className="table app-table mb-0">
            <tbody>
              <tr>
                <th className="text-muted" style={{ width: '30%' }}>Registered Store</th>
                <td className="fw-bold">{c.storeName}</td>
              </tr>
              <tr>
                <th className="text-muted">Customer Code</th>
                <td className="font-monospace fw-bold">{c.customerCode || '—'}</td>
              </tr>
              <tr>
                <th className="text-muted">Referral Code</th>
                <td>
                  <span className="badge bg-navy font-monospace fs-6 px-3 py-2">{c.referralCode || '—'}</span>
                  <div className="small text-muted mt-1">Share this unique code so others can refer you on billing.</div>
                </td>
              </tr>
              <tr>
                <th className="text-muted">Primary Mobile</th>
                <td className="font-monospace">{c.mobileNumber}</td>
              </tr>
              <tr>
                <th className="text-muted">Address</th>
                <td>{c.address || <span className="text-muted fst-italic">No address provided</span>}</td>
              </tr>
              <tr>
                <th className="text-muted">Date of birth</th>
                <td>
                  {c.dateOfBirth || <span className="text-muted fst-italic">Not recorded</span>}
                  {c.isBirthday ? <span className="badge bg-warning text-dark ms-2">Birthday today</span> : null}
                </td>
              </tr>
              <tr>
                <th className="text-muted">Ledger Debit</th>
                <td className="fw-bold text-danger"><CurrencyDisplay value={c.totalDebit ?? 0} /></td>
              </tr>
              <tr>
                <th className="text-muted">Ledger Credit</th>
                <td className="fw-bold text-success"><CurrencyDisplay value={c.totalCredit ?? 0} /></td>
              </tr>
              <tr>
                <th className="text-muted">{sides.overdue > 0 ? 'Overdue' : 'Ledger Credit Balance'}</th>
                <td className={sides.overdue > 0 ? 'fw-bold text-danger' : 'fw-bold text-success'}>
                  <CurrencyDisplay value={Math.max(sides.overdue, sides.advance)} />
                </td>
              </tr>
              <tr>
                <th className="text-muted">Reward Wallet</th>
                <td className="fw-bold text-success"><CurrencyDisplay value={wallet.data?.balance ?? c.walletBalance} /></td>
              </tr>
              <tr>
                <th className="text-muted">Member Since</th>
                <td>{formatDateTime(c.createdDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'bills' ? (
        <DataTable columns={['Bill Number', 'Bill Date', 'Grand Total', 'Amount Due']}>
          {history.data?.bills.map((b) => (
            <tr key={b.id}>
              <td>
                <Link to={`/bills/${b.id}`} className="fw-bold text-decoration-none text-primary">
                  {b.billNumber}
                </Link>
              </td>
              <td>{formatDateTime(b.billDate)}</td>
              <td className="fw-bold"><CurrencyDisplay value={b.grandTotal} /></td>
              <td className={b.dueAmount > 0 ? 'text-danger fw-bold' : 'text-muted'}>
                <CurrencyDisplay value={b.dueAmount} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === 'returns' ? (
        <DataTable columns={['Return Reference', 'Return Date', 'Credit Amount']}>
          {history.data?.returns.map((r) => (
            <tr key={r.id}>
              <td className="fw-bold">{r.returnNumber}</td>
              <td>{formatDateTime(r.returnDate)}</td>
              <td className="fw-bold text-danger"><CurrencyDisplay value={r.returnAmount} /></td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === 'wallet' ? (
        <DataTable columns={['Date & Time', 'Transaction Type', 'Amount', 'Balance After', 'Description']}>
          {wallet.data?.transactions.map((t) => (
            <tr key={t.id}>
              <td className="small text-muted">{formatDateTime(t.createdDate)}</td>
              <td>
                <span className="badge bg-light text-dark border">
                  {LEDGER_TYPE_LABELS[t.transactionType] ?? t.transactionType}
                </span>
              </td>
              <td className="fw-bold text-success"><CurrencyDisplay value={t.amount} /></td>
              <td><CurrencyDisplay value={t.balanceAfter} /></td>
              <td className="small">{t.description}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}
    </>
  )
}

export function CustomerLedgerPage() {
  const { id } = useParams()
  const customerId = Number(id)
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [payOpen, setPayOpen] = useState(false)
  const [amount, setAmount] = useState(0)
  const [mode, setMode] = useState(PaymentMode.Cash as number)
  const [ref, setRef] = useState('')
  const [receiptId, setReceiptId] = useState<number | null>(null)

  const customer = useQuery({ queryKey: queryKeys.customer(customerId), queryFn: () => customerApi.get(customerId) })
  const ledger = useQuery({
    queryKey: queryKeys.customerLedger(customerId, { page }),
    queryFn: () => customerApi.ledger(customerId, { pageNumber: page, pageSize: 30 }),
  })
  const summary = useQuery({
    queryKey: queryKeys.customerLedgerSummary(customerId),
    queryFn: () => customerApi.ledgerSummary(customerId),
    enabled: customerId > 0,
  })
  const receipt = useQuery({
    queryKey: ['customers', customerId, 'ledger-receipt', receiptId],
    queryFn: () => customerApi.ledgerReceipt(customerId, receiptId!),
    enabled: receiptId != null,
  })
  const sides = ledgerSides(
    summary.data?.currentBalance ?? customer.data?.outstandingBalance ?? 0,
    summary.data?.totalDebit ?? customer.data?.totalDebit ?? 0,
    summary.data?.totalCredit ?? customer.data?.totalCredit ?? 0,
  )

  const pay = useMutation({
    mutationFn: () =>
      customerApi.pay(customerId, {
        storeId: selectedStoreId ?? stores[0]?.storeId ?? customer.data!.storeId,
        paymentMode: mode,
        amount,
        referenceNumber: ref || undefined,
      }),
    onSuccess: async () => {
      toast.success('Payment recorded successfully')
      setPayOpen(false)
      setAmount(0)
      setRef('')
      await qc.invalidateQueries({ queryKey: ['customers', customerId] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to record payment')
    },
  })

  return (
    <>
      <PageHeader
        title={`Account Ledger · ${customer.data?.name ?? ''}`}
        subtitle={`${customer.data?.customerCode || ''} · Referral ${customer.data?.referralCode || '—'} · ${sides.overdue > 0 ? `Overdue ${formatMoney(sides.overdue)}` : sides.advance > 0 ? `Credit ${formatMoney(sides.advance)}` : 'Settled'}`}
        actions={
          <div className="page-header-actions">
            <button className="btn btn-gold" type="button" onClick={() => setPayOpen(true)}>
              <i className="bi bi-cash-stack me-1" /> Receive Payment
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => void customerApi.ledgerPdf(customerId)}>
              <i className="bi bi-file-earmark-pdf me-1" /> PDF Statement
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => window.print()}>
              <i className="bi bi-printer me-1" /> Print
            </button>
          </div>
        }
      />

      <div className="ledger-kpi">
        <div className="kpi">
          <div className="kpi-header"><span>Opening Balance</span></div>
          <strong>{formatMoney(summary.data?.openingBalance ?? 0)}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Total Debit</span></div>
          <strong className="text-danger">{formatMoney(summary.data?.totalDebit ?? 0)}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>Total Credit</span></div>
          <strong className="text-success">{formatMoney(summary.data?.totalCredit ?? 0)}</strong>
        </div>
        <div className="kpi">
          <div className="kpi-header"><span>{sides.overdue > 0 ? 'Overdue' : 'Credit Balance'}</span></div>
          <strong className={sides.overdue > 0 ? 'text-danger' : 'text-success'}>{formatMoney(Math.max(sides.overdue, sides.advance))}</strong>
        </div>
      </div>

      <DataTable
        loading={ledger.isLoading}
        columns={['Date', 'Transaction', 'Reference', 'Debit', 'Credit', 'Balance']}
        page={ledger.data?.pageNumber}
        totalPages={ledger.data?.totalPages}
        onPage={setPage}
      >
        {ledger.data?.items.map((e) => (
          <tr key={e.id}>
            <td className="small text-muted">{formatDateTime(e.transactionDate)}</td>
            <td>
              <div className="fw-semibold">{LEDGER_TYPE_LABELS[e.transactionType] ?? e.transactionType}</div>
              <div className="small text-muted">{e.description}</div>
              <button type="button" className="btn btn-link btn-sm px-0" onClick={() => setReceiptId(e.id)}>
                View Receipt
              </button>
            </td>
            <td className="small text-muted font-monospace">{e.referenceNumber || '—'}</td>
            <td className="fw-semibold text-danger">{e.debit ? formatMoney(e.debit) : '—'}</td>
            <td className="fw-semibold text-success">{e.credit ? formatMoney(e.credit) : '—'}</td>
            <td className="fw-bold text-navy-900">{formatMoney(e.balance)}</td>
          </tr>
        ))}
      </DataTable>

      <div className="card-panel mt-3">
        <div className="d-flex flex-wrap gap-4 small">
          <div>Total Debit: <strong>{formatMoney(summary.data?.totalDebit ?? 0)}</strong></div>
          <div>Total Credit: <strong>{formatMoney(summary.data?.totalCredit ?? 0)}</strong></div>
          <div>{sides.overdue > 0 ? 'Overdue' : 'Credit balance'}: <strong>{formatMoney(Math.max(sides.overdue, sides.advance))}</strong></div>
        </div>
      </div>

      <Modal open={receiptId != null} title="Transaction Receipt" onClose={() => setReceiptId(null)} wide>
        {receipt.data ? (
          <>
            <div className="print-toolbar">
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => window.print()}>Print</button>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => void customerApi.ledgerReceiptPdf(customerId, receiptId!)}>Download PDF</button>
            </div>
            <ReceiptView
              shopName={receipt.data.shopName}
              title={receipt.data.transactionType}
              fields={[
                { label: 'Store', value: receipt.data.storeName },
                { label: 'Store contact', value: receipt.data.storeContact || '—' },
                { label: 'Customer', value: receipt.data.customerName },
                { label: 'Customer code', value: receipt.data.customerCode },
                { label: 'Referral code', value: receipt.data.referralCode || customer.data?.referralCode || '—' },
                { label: 'Mobile', value: receipt.data.mobileNumber },
                { label: 'Transaction number', value: receipt.data.transactionNumber },
                { label: 'Date and time', value: formatDateTime(receipt.data.transactionDate) },
                { label: 'Transaction type', value: receipt.data.transactionType },
                { label: 'Amount', value: formatMoney(receipt.data.amount) },
                { label: 'Debit', value: formatMoney(receipt.data.debit) },
                { label: 'Credit', value: formatMoney(receipt.data.credit) },
                { label: 'Running balance', value: formatMoney(receipt.data.balance) },
                { label: 'Overdue', value: formatMoney(receipt.data.overdueAmount ?? Math.max(0, receipt.data.balance)) },
                { label: 'Credit balance', value: formatMoney(receipt.data.advanceCredit ?? Math.max(0, -receipt.data.balance)) },
                { label: 'Payment mode', value: receipt.data.paymentMode || '—' },
                { label: 'Reference number', value: receipt.data.referenceNumber || '—' },
                { label: 'Received by', value: receipt.data.receivedBy || '—' },
                { label: 'Description', value: receipt.data.description || '—' },
              ]}
            />
          </>
        ) : (
          <div className="text-muted">Loading receipt…</div>
        )}
      </Modal>

      {/* Receive Payment Modal */}
      <Modal open={payOpen} title="Receive Customer Due Payment" onClose={() => setPayOpen(false)}>
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault()
            pay.mutate()
          }}
        >
          <div className="p-3 bg-light rounded-3 mb-2">
            <span className="text-muted small d-block">{sides.overdue > 0 ? 'Current overdue' : 'Current credit balance'}</span>
            <strong className={`fs-5 ${sides.overdue > 0 ? 'text-danger' : 'text-success'}`}>
              {formatMoney(Math.max(sides.overdue, sides.advance))}
            </strong>
            <div className="small text-muted mt-1">
              Debit {formatMoney(sides.totalDebit)} · Credit {formatMoney(sides.totalCredit)}
            </div>
          </div>

          <FormField label="Payment Amount (₹)" required>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                className="form-control"
                type="number"
                min={1}
                step="any"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter received amount"
                required
              />
            </div>
          </FormField>

          <FormField label="Payment Mode" required>
            <select
              className="form-select"
              value={mode}
              onChange={(e) => setMode(Number(e.target.value))}
            >
              {Object.entries(PAYMENT_LABELS)
                .filter(([k]) => Number(k) !== 5)
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField label="Transaction / UPI Reference Number">
            <input
              className="form-control"
              placeholder="e.g. UPI Ref / Cheque No."
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </FormField>

          <div className="app-modal-actions">
            <button type="button" className="btn btn-light border px-3" onClick={() => setPayOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={pay.isPending || !amount}>
              {pay.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Recording…
                </>
              ) : (
                'Save Payment'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function DuesPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined, period: 'custom' }
  const q = useQuery({ queryKey: queryKeys.reports('dues', query), queryFn: () => reportApi.customerDues(query) })

  return (
    <>
      <PageHeader
        title="Pending Customer Dues (Udhaar)"
        subtitle="Track outstanding balances, credit aging, and collect pending customer bills"
        actions={
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => void reportApi.exportCustomersExcel(query)}
          >
            <i className="bi bi-file-earmark-excel me-1" /> Export Excel
          </button>
        }
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Filter customer name or mobile…"
        />
        <StoreSelector />
      </div>

      <DataTable
        loading={q.isLoading}
        columns={['Customer Name', 'Mobile Number', 'Store ID', 'Total Purchases', 'Outstanding Due', 'Aging (Days)', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.customerId}>
            <td>
              <Link to={`/customers/${r.customerId}`} className="fw-bold text-navy-900 text-decoration-none">
                {r.name}
              </Link>
            </td>
            <td className="font-monospace">{r.mobile}</td>
            <td>
              <span className="badge bg-light text-dark border">Store #{r.storeId}</span>
            </td>
            <td><CurrencyDisplay value={r.totalPurchases} /></td>
            <td className="fw-bold text-danger"><CurrencyDisplay value={r.outstandingAmount} /></td>
            <td>
              <span className={`badge ${r.agingDays > 30 ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill`}>
                {r.agingDays} days
              </span>
            </td>
            <td>
              <div className="d-flex gap-1">
                <Link className="btn btn-sm btn-outline-secondary" to={`/customers/${r.customerId}/ledger`}>
                  Ledger
                </Link>
                <Link className="btn btn-sm btn-gold" to={`/customers/${r.customerId}/ledger`}>
                  Receive
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function ReferralsPage() {
  const { selectedStoreId } = useStore()
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.referrals(query), queryFn: () => referralApi.list(query) })

  return (
    <>
      <PageHeader
        title="Referral Schemes & Rewards"
        subtitle="Track customer referrals and automatic loyalty reward credits"
      />

      <DataTable
        loading={q.isLoading}
        columns={['Referrer Member', 'Referred Customer', 'Reward Value', 'Reward Status', 'Referral Date']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td>
              <Link to={`/customers/${r.referrerCustomerId}`} className="fw-bold text-decoration-none text-dark">
                {r.referrerName}
              </Link>
            </td>
            <td>
              <Link to={`/customers/${r.referredCustomerId}`} className="text-decoration-none text-muted">
                {r.referredName}
              </Link>
            </td>
            <td className="fw-bold text-success">
              <CurrencyDisplay value={r.rewardAmount} />
            </td>
            <td>
              <span className={`badge ${r.status === 2 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-dark'} rounded-pill`}>
                {REFERRAL_STATUS_LABELS[r.status] ?? r.status}
              </span>
            </td>
            <td className="small text-muted">{formatDateTime(r.referralDate)}</td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
