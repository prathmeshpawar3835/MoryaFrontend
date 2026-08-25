import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customerApi'
import { discountApi, supplierApi } from '../../api/opsApi'
import { repairApi } from '../../api/repairApi'
import { billApi } from '../../api/billApi'
import { reportApi } from '../../api/reportApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, CurrencyDisplay } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { FormField } from '../../components/common/FormField'
import { Modal } from '../../components/common/Modal'
import { formatDateTime, formatMoney } from '../../utils/format'
import { ITEM_STATUS_LABELS, REPAIR_STATUS_LABELS, REPAIR_TYPE_LABELS } from '../../constants/labels'
import { DiscountKind, OfferCategory, RepairJobStatus, RepairJobType } from '../../types'
import type { StoreDiscount } from '../../types'

export function CustomerLedgerSearchPage() {
  const navigate = useNavigate()
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const q = useQuery({
    queryKey: queryKeys.customerSearch(search, selectedStoreId),
    queryFn: () => customerApi.search(search, selectedStoreId),
    enabled: search.trim().length >= 3,
  })

  return (
    <>
      <PageHeader title="Customer Ledger" subtitle="Search by mobile number, customer code, or name" />
      <div className="card-panel">
        <SearchBox value={search} onChange={setSearch} placeholder="Mobile / customer code / name" />
        {q.data?.length ? (
          <div className="table-responsive mt-3">
            <table className="table app-table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Code</th>
                  <th>Credit</th>
                  <th>Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.data.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-bold">{c.name}</td>
                    <td>{c.mobileNumber}</td>
                    <td className="font-monospace">{c.customerCode || c.referralCode}</td>
                    <td><CurrencyDisplay value={c.walletBalance} /></td>
                    <td><CurrencyDisplay value={c.outstandingBalance} /></td>
                    <td>
                      <button className="btn btn-sm btn-gold" type="button" onClick={() => navigate(`/customers/${c.id}/ledger`)}>
                        Open ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : search.trim().length >= 3 && !q.isLoading ? (
          <p className="text-muted mt-3 mb-0">No matching customer.</p>
        ) : null}
      </div>
    </>
  )
}

export function DiscountsPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<number>(DiscountKind.Percentage)
  const [value, setValue] = useState(0)
  const q = useQuery({
    queryKey: queryKeys.discounts(selectedStoreId, false),
    queryFn: () => discountApi.list(selectedStoreId, false),
  })
  const create = useMutation({
    mutationFn: () =>
      discountApi.create({
        storeId: selectedStoreId ?? stores[0]?.storeId ?? 0,
        name,
        offerCategory: OfferCategory.Store,
        discountKind: kind,
        value,
        isActive: true,
      }),
    onSuccess: async () => {
      toast.success('Discount saved')
      setOpen(false)
      setName('')
      setValue(0)
      await qc.invalidateQueries({ queryKey: ['discounts'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save discount'),
  })

  return (
    <>
      <PageHeader
        title="Store Discounts"
        subtitle="Configure store-wise billing discounts. Percentages are not hardcoded."
        actions={
          <button className="btn btn-gold" type="button" onClick={() => setOpen(true)}>
            Add discount
          </button>
        }
      />
      <DataTable loading={q.isLoading} columns={['Name', 'Store', 'Value', 'Validity', 'Status', '']}>
        {q.data?.map((d) => (
          <tr key={d.id}>
            <td className="fw-bold">{d.name}</td>
            <td>{d.storeName}</td>
            <td>{d.discountKind === DiscountKind.Percentage ? `${d.value}%` : formatMoney(d.value)}</td>
            <td className="small text-muted">{d.validFrom || d.validTo ? `${d.validFrom ?? '—'} → ${d.validTo ?? '—'}` : 'Always'}</td>
            <td>
              <span className={`badge ${d.isActive ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>{d.isActive ? 'Active' : 'Inactive'}</span>
            </td>
            <td>
              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => discountApi.remove(d.id).then(() => qc.invalidateQueries({ queryKey: ['discounts'] }))}>
                Deactivate
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
      <Modal open={open} title="New store discount" onClose={() => setOpen(false)}>
        <FormField label="Name" required>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Type">
          <select className="form-select" value={kind} onChange={(e) => setKind(Number(e.target.value))}>
            <option value={DiscountKind.Percentage}>Percentage</option>
            <option value={DiscountKind.Amount}>Fixed amount</option>
          </select>
        </FormField>
        <FormField label="Value" required>
          <input className="form-control" type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </FormField>
        <button className="btn btn-gold mt-2" type="button" disabled={create.isPending} onClick={() => create.mutate()}>
          Save
        </button>
      </Modal>
    </>
  )
}

export function BirthdayOffersPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('Birthday Special Offer')
  const [description, setDescription] = useState('Valid only on your birthday')
  const [kind, setKind] = useState<number>(DiscountKind.Percentage)
  const [value, setValue] = useState(10)
  const [storeId, setStoreId] = useState<number>(selectedStoreId ?? stores[0]?.storeId ?? 0)
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [isActive, setIsActive] = useState(true)
  const q = useQuery({
    queryKey: queryKeys.discounts(selectedStoreId, false, OfferCategory.Birthday),
    queryFn: () => discountApi.list(selectedStoreId, false, OfferCategory.Birthday),
  })

  const resetForm = (offer?: StoreDiscount) => {
    setEditingId(offer?.id ?? null)
    setName(offer?.name ?? 'Birthday Special Offer')
    setDescription(offer?.description ?? 'Valid only on your birthday')
    setKind(offer?.discountKind ?? DiscountKind.Percentage)
    setValue(offer?.value ?? 10)
    setStoreId(offer?.storeId ?? selectedStoreId ?? stores[0]?.storeId ?? 0)
    setValidFrom(offer?.validFrom ? offer.validFrom.slice(0, 10) : '')
    setValidTo(offer?.validTo ? offer.validTo.slice(0, 10) : '')
    setIsActive(offer?.isActive ?? true)
    setOpen(true)
  }

  const payload = {
    storeId,
    name,
    description: description || undefined,
    offerCategory: OfferCategory.Birthday,
    discountKind: kind,
    value,
    validFrom: validFrom || undefined,
    validTo: validTo || undefined,
    isActive,
  }

  const save = useMutation({
    mutationFn: () => (editingId ? discountApi.update(editingId, payload) : discountApi.create(payload)),
    onSuccess: async () => {
      toast.success(editingId ? 'Birthday offer updated' : 'Birthday offer created')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['discounts'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save birthday offer'),
  })

  return (
    <>
      <PageHeader
        title="Birthday Offers"
        subtitle="Configure store-wise birthday discounts. They are valid only on the customer's birthday and are never hardcoded."
        actions={
          <button className="btn btn-gold" type="button" onClick={() => resetForm()}>
            Add birthday offer
          </button>
        }
      />
      <DataTable loading={q.isLoading} columns={['Name', 'Store', 'Offer', 'Validity', 'Status', '']}>
        {q.data?.map((d) => (
          <tr key={d.id}>
            <td>
              <div className="fw-bold">{d.name}</div>
              <div className="small text-muted">{d.description || 'Valid only on your birthday'}</div>
            </td>
            <td>{d.storeName}</td>
            <td>{d.discountKind === DiscountKind.Percentage ? `${d.value}% OFF` : formatMoney(d.value)}</td>
            <td className="small text-muted">{d.validFrom || d.validTo ? `${d.validFrom ?? '—'} → ${d.validTo ?? '—'}` : 'Program always available'}</td>
            <td>
              <span className={`badge ${d.isActive ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>{d.isActive ? 'Active' : 'Inactive'}</span>
            </td>
            <td className="text-nowrap">
              <button className="btn btn-sm btn-outline-secondary me-1" type="button" onClick={() => resetForm(d)}>
                Edit
              </button>
              <button
                className="btn btn-sm btn-outline-secondary me-1"
                type="button"
                onClick={() =>
                  discountApi.update(d.id, { ...d, offerCategory: OfferCategory.Birthday, isActive: !d.isActive }).then(() => qc.invalidateQueries({ queryKey: ['discounts'] }))
                }
              >
                {d.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => discountApi.remove(d.id).then(() => qc.invalidateQueries({ queryKey: ['discounts'] }))}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
      <Modal open={open} title={editingId ? 'Update birthday offer' : 'New birthday offer'} onClose={() => setOpen(false)}>
        <FormField label="Offer name" required>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Description">
          <textarea className="form-control" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Store" required>
          <select className="form-select" value={storeId} onChange={(e) => setStoreId(Number(e.target.value))}>
            {stores.map((s) => (
              <option key={s.storeId} value={s.storeId}>
                {s.storeName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Type">
          <select className="form-select" value={kind} onChange={(e) => setKind(Number(e.target.value))}>
            <option value={DiscountKind.Percentage}>Percentage</option>
            <option value={DiscountKind.Amount}>Fixed amount</option>
          </select>
        </FormField>
        <FormField label="Value" required hint="Percentage or rupee amount. Not hardcoded — configured here.">
          <input className="form-control" type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </FormField>
        <FormField label="Program valid from">
          <input className="form-control" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </FormField>
        <FormField label="Program valid to">
          <input className="form-control" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
        </FormField>
        <div className="form-check form-switch mb-3">
          <input className="form-check-input" type="checkbox" id="bdayActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label className="form-check-label" htmlFor="bdayActive">Active</label>
        </div>
        <p className="small text-muted">Redemption is always limited to the customer's birthday even when the program window is longer.</p>
        <button className="btn btn-gold mt-2" type="button" disabled={save.isPending} onClick={() => save.mutate()}>
          Save
        </button>
      </Modal>
    </>
  )
}

export function SuppliersPage() {
  const { selectedStoreId } = useStore()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [contact, setContact] = useState('')
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.suppliers(query), queryFn: () => supplierApi.list(query) })
  const create = useMutation({
    mutationFn: () => supplierApi.create({ name, phone, contactPerson: contact, isActive: true, storeId: selectedStoreId }),
    onSuccess: async () => {
      toast.success('Supplier saved')
      setOpen(false)
      setName('')
      await qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save supplier'),
  })

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Supplier master used with purchase and inventory inward"
        actions={<button className="btn btn-gold" type="button" onClick={() => setOpen(true)}>Add supplier</button>}
      />
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search supplier" />
      <DataTable loading={q.isLoading} columns={['Name', 'Contact', 'Phone', 'Purchased', 'Status']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((s) => (
          <tr key={s.id}>
            <td className="fw-bold">{s.name}</td>
            <td>{s.contactPerson || '—'}</td>
            <td>{s.phone || '—'}</td>
            <td><CurrencyDisplay value={s.totalPurchased} /></td>
            <td>{s.isActive ? 'Active' : 'Inactive'}</td>
          </tr>
        ))}
      </DataTable>
      <Modal open={open} title="New supplier" onClose={() => setOpen(false)}>
        <FormField label="Supplier name" required>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Contact person">
          <input className="form-control" value={contact} onChange={(e) => setContact(e.target.value)} />
        </FormField>
        <FormField label="Phone">
          <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <button className="btn btn-gold mt-2" type="button" disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
          Save
        </button>
      </Modal>
    </>
  )
}

export function RepairsPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [invoice, setInvoice] = useState('')
  const [billId, setBillId] = useState(0)
  const [productName, setProductName] = useState('')
  const [billItemId, setBillItemId] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [jobType, setJobType] = useState<number>(RepairJobType.Repair)
  const [notes, setNotes] = useState('')
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.repairs(query), queryFn: () => repairApi.list(query) })
  const bills = useQuery({
    queryKey: ['bills', 'repair-lookup', invoice, selectedStoreId],
    queryFn: () => billApi.search({ search: invoice, storeId: selectedStoreId, pageSize: 5, pageNumber: 1 }),
    enabled: invoice.trim().length >= 3,
  })
  const bill = useQuery({
    queryKey: queryKeys.bill(billId),
    queryFn: () => billApi.get(billId),
    enabled: billId > 0,
  })

  const create = useMutation({
    mutationFn: () =>
      repairApi.create({
        storeId: selectedStoreId ?? stores[0]?.storeId ?? 0,
        customerName,
        mobileNumber: mobile,
        billId: billId || undefined,
        billItemId: billItemId || undefined,
        invoiceNumber: invoice || undefined,
        productName,
        jobType,
        notes,
      }),
    onSuccess: async () => {
      toast.success('Job recorded')
      setOpen(false)
      await qc.invalidateQueries({ queryKey: ['repairs'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create job'),
  })

  return (
    <>
      <PageHeader
        title="Repair / Polish"
        subtitle="Receive jewellery for repair or polish and track Received → In Progress → Ready → Delivered"
        actions={<button className="btn btn-gold" type="button" onClick={() => setOpen(true)}>New job</button>}
      />
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Mobile, invoice, job number, product" />
      <DataTable loading={q.isLoading} columns={['Job', 'Customer', 'Product', 'Type', 'Status', 'Received', '']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((j) => (
          <tr key={j.id}>
            <td className="font-monospace fw-bold">{j.jobNumber}</td>
            <td>{j.customerName}<div className="small text-muted">{j.mobileNumber}</div></td>
            <td>{j.productName}</td>
            <td>{REPAIR_TYPE_LABELS[j.jobType]}</td>
            <td>{REPAIR_STATUS_LABELS[j.status]}</td>
            <td className="small">{formatDateTime(j.receivedDate)}</td>
            <td>
              {j.status < RepairJobStatus.Delivered ? (
                <select
                  className="form-select form-select-sm"
                  value={j.status}
                  onChange={(e) =>
                    repairApi.update(j.id, { status: Number(e.target.value) }).then(() => qc.invalidateQueries({ queryKey: ['repairs'] }))
                  }
                >
                  <option value={1}>Received</option>
                  <option value={2}>In progress</option>
                  <option value={3}>Ready</option>
                  <option value={4}>Delivered</option>
                </select>
              ) : (
                'Delivered'
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      <Modal open={open} title="Accept repair / polish" onClose={() => setOpen(false)} wide>
        <FormField label="Invoice number">
          <input className="form-control" value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="Search invoice" />
        </FormField>
        {bills.data?.items.map((b) => (
          <button key={b.id} type="button" className="btn btn-sm btn-outline-secondary me-1 mb-2" onClick={() => { setBillId(b.id); setInvoice(b.billNumber); setCustomerName(b.customerName || ''); setMobile(b.customerMobile || '') }}>
            {b.billNumber}
          </button>
        ))}
        {bill.data ? (
          <div className="mb-3">
            {bill.data.items.map((i) => (
              <button key={i.id} type="button" className="btn btn-sm btn-outline-primary me-1 mb-1" onClick={() => { setBillItemId(i.id); setProductName(i.productName) }}>
                {i.productName} · {ITEM_STATUS_LABELS[i.fulfillmentStatus ?? 1]}
              </button>
            ))}
          </div>
        ) : null}
        <div className="row g-2">
          <div className="col-md-6">
            <FormField label="Customer name" required>
              <input className="form-control" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Mobile" required>
              <input className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Product" required>
              <input className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Type">
              <select className="form-select" value={jobType} onChange={(e) => setJobType(Number(e.target.value))}>
                <option value={RepairJobType.Repair}>Repair</option>
                <option value={RepairJobType.Polish}>Polish</option>
              </select>
            </FormField>
          </div>
        </div>
        <FormField label="Notes">
          <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <button className="btn btn-gold" type="button" disabled={create.isPending || !customerName || !mobile || !productName} onClick={() => create.mutate()}>
          Save job
        </button>
      </Modal>
    </>
  )
}

export function ProductAnalyticsPage() {
  const { selectedStoreId } = useStore()
  const query = { storeId: selectedStoreId ?? undefined, pageSize: 10, period: 'monthly' }
  const top = useQuery({ queryKey: queryKeys.reports('product-top', query), queryFn: () => reportApi.productSales({ ...query, slowMoving: false }) })
  const slow = useQuery({ queryKey: queryKeys.reports('product-slow', query), queryFn: () => reportApi.productSales({ ...query, slowMoving: true }) })
  const stock = useQuery({ queryKey: queryKeys.reports('inventory', query), queryFn: () => reportApi.inventory(query) })

  return (
    <>
      <PageHeader title="Product Analytics" subtitle="Live top selling, slow moving, and low stock from actual transactions" />
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-panel">
            <h2>Top selling</h2>
            <DataTable columns={['Product', 'Qty', 'Amount']}>
              {top.data?.items.map((p) => (
                <tr key={p.productId}>
                  <td>{p.productName}</td>
                  <td>{p.quantitySold}</td>
                  <td><CurrencyDisplay value={p.revenue} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-panel">
            <h2>Slow moving</h2>
            <DataTable columns={['Product', 'Qty', 'Amount']}>
              {slow.data?.items.map((p) => (
                <tr key={p.productId}>
                  <td>{p.productName}</td>
                  <td>{p.quantitySold}</td>
                  <td><CurrencyDisplay value={p.revenue} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
        <div className="col-12">
          <div className="card-panel">
            <h2>Low / out of stock</h2>
            <DataTable columns={['Product', 'Qty', 'Flag']}>
              {stock.data?.items.filter((p) => p.isLowStock || p.isOutOfStock).map((p) => (
                <tr key={`${p.storeId}-${p.productId}`}>
                  <td>{p.productName}</td>
                  <td>{p.quantity}</td>
                  <td>{p.isOutOfStock ? 'Out of stock' : 'Low stock'}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
      </div>
    </>
  )
}
