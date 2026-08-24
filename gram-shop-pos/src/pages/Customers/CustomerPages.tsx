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
import { formatDateTime, formatMoney } from '../../utils/format'
import { LEDGER_TYPE_LABELS, PAYMENT_LABELS, REFERRAL_STATUS_LABELS } from '../../constants/labels'
import { PaymentMode } from '../../types'
import type { z } from 'zod'

type Form = z.infer<typeof customerSchema>

export function CustomersPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.customers(query), queryFn: () => customerApi.list(query) })
  const form = useForm<Form>({ resolver: zodResolver(customerSchema) as Resolver<Form>, defaultValues: { storeId: selectedStoreId ?? stores[0]?.storeId ?? 0, name: '', mobileNumber: '', address: '' } })
  const create = useMutation({
    mutationFn: (v: Form) => customerApi.create({ storeId: v.storeId, name: v.name, mobileNumber: v.mobileNumber, address: v.address, referralCode: v.referralCode, referringMobileNumber: v.referringMobileNumber }),
    onSuccess: async () => {
      toast.success('Customer created')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  return (
    <>
      <PageHeader title="Customers" actions={<button className="btn btn-gold" type="button" onClick={() => setOpen(true)}>Add customer</button>} />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name or mobile" />
        <StoreSelector />
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load customers' : null} columns={['ID', 'Name', 'Mobile', 'Store', 'Referral', 'Due', 'Wallet', 'Status', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((c) => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.name}</td>
            <td>{c.mobileNumber}</td>
            <td>{c.storeName}</td>
            <td>{c.referralCode}</td>
            <td><CurrencyDisplay value={c.outstandingBalance} /></td>
            <td><CurrencyDisplay value={c.walletBalance} /></td>
            <td><StatusBadge active={c.isActive} /></td>
            <td>
              <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${c.id}`}>View</Link>
              <Link className="btn btn-sm btn-outline-secondary" to={`/customers/${c.id}/ledger`}>Ledger</Link>
            </td>
          </tr>
        ))}
      </DataTable>
      <Modal open={open} title="Add customer" onClose={() => setOpen(false)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => create.mutate(v))}>
          <label>Store<select className="form-select" {...form.register('storeId', { valueAsNumber: true })}>{stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}</select></label>
          <label>Name<input className="form-control" {...form.register('name')} /></label>
          <label>Mobile<input className="form-control" {...form.register('mobileNumber')} /></label>
          <label>Address<input className="form-control" {...form.register('address')} /></label>
          <label>Referral code used<input className="form-control" {...form.register('referralCode')} /></label>
          <label>Referring mobile<input className="form-control" {...form.register('referringMobileNumber')} /></label>
          <button className="btn btn-gold" type="submit">Save</button>
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
  if (!c) return <PageHeader title="Customer" />
  return (
    <>
      <PageHeader title={c.name} subtitle={c.mobileNumber} actions={<Link className="btn btn-outline-secondary" to={`/customers/${c.id}/ledger`}>Ledger</Link>} />
      <div className="kpi-grid">
        <div className="kpi"><span>Outstanding</span><strong><CurrencyDisplay value={c.outstandingBalance} /></strong></div>
        <div className="kpi"><span>Wallet</span><strong><CurrencyDisplay value={c.walletBalance} /></strong></div>
        <div className="kpi"><span>Referral</span><strong>{c.referralCode}</strong></div>
      </div>
      <div className="btn-group mb-3">
        {['info', 'bills', 'returns', 'wallet'].map((t) => (
          <button key={t} type="button" className={`btn btn-sm ${tab === t ? 'btn-gold' : 'btn-outline-secondary'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'info' ? (
        <div className="card-panel">
          <p>Store {c.storeName}</p>
          <p>Address {c.address || '—'}</p>
          <p>Created {formatDateTime(c.createdDate)}</p>
        </div>
      ) : null}
      {tab === 'bills' ? (
        <DataTable columns={['Bill', 'Date', 'Total', 'Due']}>
          {history.data?.bills.map((b) => (
            <tr key={b.id}>
              <td><Link to={`/bills/${b.id}`}>{b.billNumber}</Link></td>
              <td>{formatDateTime(b.billDate)}</td>
              <td><CurrencyDisplay value={b.grandTotal} /></td>
              <td><CurrencyDisplay value={b.dueAmount} /></td>
            </tr>
          ))}
        </DataTable>
      ) : null}
      {tab === 'returns' ? (
        <DataTable columns={['Return', 'Date', 'Amount']}>
          {history.data?.returns.map((r) => (
            <tr key={r.id}>
              <td>{r.returnNumber}</td>
              <td>{formatDateTime(r.returnDate)}</td>
              <td><CurrencyDisplay value={r.returnAmount} /></td>
            </tr>
          ))}
        </DataTable>
      ) : null}
      {tab === 'wallet' ? (
        <DataTable columns={['Date', 'Type', 'Amount', 'Balance', 'Description']}>
          {wallet.data?.transactions.map((t) => (
            <tr key={t.id}>
              <td>{formatDateTime(t.createdDate)}</td>
              <td>{LEDGER_TYPE_LABELS[t.transactionType] ?? t.transactionType}</td>
              <td><CurrencyDisplay value={t.amount} /></td>
              <td><CurrencyDisplay value={t.balanceAfter} /></td>
              <td>{t.description}</td>
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
  const customer = useQuery({ queryKey: queryKeys.customer(customerId), queryFn: () => customerApi.get(customerId) })
  const ledger = useQuery({ queryKey: queryKeys.customerLedger(customerId, { page }), queryFn: () => customerApi.ledger(customerId, { pageNumber: page, pageSize: 30 }) })
  const pay = useMutation({
    mutationFn: () => customerApi.pay(customerId, { storeId: selectedStoreId ?? stores[0]?.storeId ?? customer.data!.storeId, paymentMode: mode, amount, referenceNumber: ref || undefined }),
    onSuccess: async () => {
      toast.success('Payment received')
      setPayOpen(false)
      await qc.invalidateQueries({ queryKey: ['customers', customerId] })
    },
  })
  return (
    <>
      <PageHeader
        title={`Ledger · ${customer.data?.name ?? ''}`}
        subtitle={`Balance ${formatMoney(customer.data?.outstandingBalance ?? 0)}`}
        actions={
          <>
            <button className="btn btn-gold" type="button" onClick={() => setPayOpen(true)}>Receive payment</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => void customerApi.ledgerPdf(customerId)}>PDF</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => window.print()}>Print</button>
          </>
        }
      />
      <DataTable loading={ledger.isLoading} columns={['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance', 'Ref']} page={ledger.data?.pageNumber} totalPages={ledger.data?.totalPages} onPage={setPage}>
        {ledger.data?.items.map((e) => (
          <tr key={e.id}>
            <td>{formatDateTime(e.transactionDate)}</td>
            <td>{LEDGER_TYPE_LABELS[e.transactionType] ?? e.transactionType}</td>
            <td>{e.description}</td>
            <td>{e.debit ? formatMoney(e.debit) : ''}</td>
            <td>{e.credit ? formatMoney(e.credit) : ''}</td>
            <td>{formatMoney(e.balance)}</td>
            <td>{e.referenceNumber}</td>
          </tr>
        ))}
      </DataTable>
      <Modal open={payOpen} title="Receive payment" onClose={() => setPayOpen(false)}>
        <form className="stack-form" onSubmit={(e) => { e.preventDefault(); pay.mutate() }}>
          <label>Amount<input className="form-control" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          <label>Mode<select className="form-select" value={mode} onChange={(e) => setMode(Number(e.target.value))}>{Object.entries(PAYMENT_LABELS).filter(([k]) => Number(k) !== 5).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Reference<input className="form-control" value={ref} onChange={(e) => setRef(e.target.value)} /></label>
          <button className="btn btn-gold" type="submit">Save payment</button>
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
      <PageHeader title="Customer dues" actions={<button className="btn btn-outline-secondary" type="button" onClick={() => void reportApi.exportCustomersExcel(query)}>Excel</button>} />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
        <StoreSelector />
      </div>
      <DataTable loading={q.isLoading} columns={['Customer', 'Mobile', 'Store', 'Purchases', 'Outstanding', 'Aging', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.customerId}>
            <td>{r.name}</td>
            <td>{r.mobile}</td>
            <td>{r.storeId}</td>
            <td><CurrencyDisplay value={r.totalPurchases} /></td>
            <td><CurrencyDisplay value={r.outstandingAmount} /></td>
            <td>{r.agingDays}</td>
            <td>
              <Link className="btn btn-sm btn-outline-secondary me-1" to={`/customers/${r.customerId}/ledger`}>Ledger</Link>
              <Link className="btn btn-sm btn-gold" to={`/customers/${r.customerId}/ledger`}>Receive</Link>
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
      <PageHeader title="Referrals" subtitle="Rewards credited by the billing API" />
      <DataTable loading={q.isLoading} columns={['Referrer', 'Referred', 'Reward', 'Status', 'Date']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td><Link to={`/customers/${r.referrerCustomerId}`}>{r.referrerName}</Link></td>
            <td><Link to={`/customers/${r.referredCustomerId}`}>{r.referredName}</Link></td>
            <td><CurrencyDisplay value={r.rewardAmount} /></td>
            <td>{REFERRAL_STATUS_LABELS[r.status] ?? r.status}</td>
            <td>{formatDateTime(r.referralDate)}</td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
