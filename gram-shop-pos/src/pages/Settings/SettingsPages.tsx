import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { storeApi } from '../../api/storeApi'
import { userApi } from '../../api/userApi'
import { settingsApi } from '../../api/settingsApi'
import { queryKeys } from '../../api/queryKeys'
import { storeSchema, userSchema } from '../../validators/schemas'
import { PageHeader, SearchBox, StatusBadge } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { Modal } from '../../components/common/Modal'
import { FormField } from '../../components/common/FormField'
import { formatDateTime } from '../../utils/format'
import { toastApiError } from '../../utils/errors'
import { useStore } from '../../context/StoreContext'
import type { Settings, Store, User } from '../../types'
import type { z } from 'zod'

type StoreForm = z.infer<typeof storeSchema>
type UserForm = z.infer<typeof userSchema>

export function StoresSettingsPage() {
  const qc = useQueryClient()
  const store = useStore()
  const q = useQuery({ queryKey: queryKeys.stores, queryFn: storeApi.list })
  const [editing, setEditing] = useState<Store | 'new' | null>(null)
  const form = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    mode: 'onTouched',
    values:
      editing && editing !== 'new'
        ? {
            storeCode: editing.storeCode,
            storeName: editing.storeName,
            address: editing.address ?? '',
            contactNumber: editing.contactNumber ?? '',
            gstNumber: editing.gstNumber ?? '',
            invoicePrefix: editing.invoicePrefix ?? '',
            isActive: editing.isActive,
          }
        : {
            storeCode: '',
            storeName: '',
            address: '',
            contactNumber: '',
            gstNumber: '',
            invoicePrefix: '',
            isActive: true,
          },
  })

  const save = useMutation({
    mutationFn: (v: StoreForm) =>
      editing && editing !== 'new'
        ? storeApi.update(editing.id, { ...v, isActive: v.isActive ?? true })
        : storeApi.create(v),
    onSuccess: async () => {
      toast.success('Store branch saved successfully')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: queryKeys.stores })
      await store.refreshStores()
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to save store')
    },
  })

  return (
    <>
      <PageHeader
        title="Store Branches"
        subtitle="Manage retail showroom locations and branch billing prefixes"
        actions={
          <button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>
            <i className="bi bi-plus-lg me-1" /> Add Store Branch
          </button>
        }
      />

      <DataTable loading={q.isLoading} columns={['Branch Code', 'Branch Showroom Name', 'GSTIN', 'Status', 'Actions']}>
        {q.data?.map((s) => (
          <tr key={s.id}>
            <td>
              <span className="badge bg-light text-dark border font-monospace fs-6">{s.storeCode}</span>
            </td>
            <td>
              <strong className="text-navy-900">{s.storeName}</strong>
              {s.address ? <div className="small text-muted">{s.address}</div> : null}
            </td>
            <td className="font-monospace">{s.gstNumber || '—'}</td>
            <td>
              <StatusBadge active={s.isActive} />
            </td>
            <td>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditing(s)}>
                <i className="bi bi-pencil me-1" /> Edit
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Store Modal */}
      <Modal open={editing !== null} title={editing === 'new' ? 'Add Store Branch' : 'Edit Store Branch'} onClose={() => setEditing(null)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
          <div className="row g-2">
            <div className="col-sm-6">
              <FormField label="Store Code" required error={form.formState.errors.storeCode?.message}>
                <input
                  className={`form-control ${form.formState.errors.storeCode ? 'is-invalid' : ''}`}
                  placeholder="e.g. STR-MUM"
                  {...form.register('storeCode')}
                />
              </FormField>
            </div>
            <div className="col-sm-6">
              <FormField label="Invoice Prefix" error={form.formState.errors.invoicePrefix?.message}>
                <input
                  className={`form-control ${form.formState.errors.invoicePrefix ? 'is-invalid' : ''}`}
                  placeholder="e.g. MUM-"
                  {...form.register('invoicePrefix')}
                />
              </FormField>
            </div>
          </div>

          <FormField label="Store Showroom Name" required error={form.formState.errors.storeName?.message}>
            <input
              className={`form-control ${form.formState.errors.storeName ? 'is-invalid' : ''}`}
              placeholder="e.g. Mumbai Main Branch"
              {...form.register('storeName')}
            />
          </FormField>

          <FormField label="Full Address" error={form.formState.errors.address?.message}>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Store physical street address"
              {...form.register('address')}
            />
          </FormField>

          <div className="row g-2">
            <div className="col-sm-6">
              <FormField label="Contact Phone" error={form.formState.errors.contactNumber?.message}>
                <input
                  className="form-control"
                  placeholder="e.g. 022-24150000"
                  {...form.register('contactNumber')}
                />
              </FormField>
            </div>
            <div className="col-sm-6">
              <FormField label="GST Number" error={form.formState.errors.gstNumber?.message}>
                <input
                  className="form-control"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  {...form.register('gstNumber')}
                />
              </FormField>
            </div>
          </div>

          {editing && editing !== 'new' ? (
            <div className="form-check form-switch mt-2">
              <input type="checkbox" className="form-check-input" id="stActive" {...form.register('isActive')} />
              <label className="form-check-label fw-semibold" htmlFor="stActive">
                Active Store Branch
              </label>
            </div>
          ) : null}

          <div className="app-modal-actions">
            <button type="button" className="btn btn-light border px-3" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function UsersSettingsPage() {
  const qc = useQueryClient()
  const stores = useQuery({ queryKey: queryKeys.stores, queryFn: storeApi.list })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, search }
  const q = useQuery({ queryKey: queryKeys.users(query), queryFn: () => userApi.list(query) })
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    mode: 'onTouched',
    values:
      editing && editing !== 'new'
        ? {
            userName: editing.userName,
            fullName: editing.fullName,
            email: editing.email ?? '',
            phoneNumber: editing.phoneNumber ?? '',
            role: editing.role,
            storeIds: editing.storeIds,
            isActive: editing.isActive,
            password: '',
          }
        : {
            userName: '',
            password: '',
            fullName: '',
            email: '',
            phoneNumber: '',
            role: 'SalesPerson',
            storeIds: [],
            isActive: true,
          },
  })

  const save = useMutation({
    mutationFn: (v: UserForm) => {
      if (editing && editing !== 'new') {
        return userApi.update(editing.id, {
          fullName: v.fullName,
          email: v.email || undefined,
          phoneNumber: v.phoneNumber,
          role: v.role,
          isActive: v.isActive ?? true,
          storeIds: v.storeIds,
        })
      }
      return userApi.create({
        userName: v.userName,
        password: v.password || '',
        fullName: v.fullName,
        email: v.email || undefined,
        phoneNumber: v.phoneNumber,
        role: v.role,
        storeIds: v.storeIds,
      })
    },
    onSuccess: async () => {
      toast.success('User account saved successfully')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to save user account')
    },
  })

  return (
    <>
      <PageHeader
        title="User Accounts & Roles"
        subtitle="Manage staff logins, counter sales roles, and store branch access"
        actions={
          <button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>
            <i className="bi bi-person-plus me-1" /> Create User
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
          placeholder="Filter staff by name or username…"
        />
      </div>

      <DataTable
        loading={q.isLoading}
        columns={['Username', 'Full Staff Name', 'Role Level', 'Account Status', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((u) => (
          <tr key={u.id}>
            <td>
              <span className="fw-bold font-monospace text-dark">@{u.userName}</span>
            </td>
            <td>
              <div className="fw-semibold text-navy-900">{u.fullName}</div>
              {u.email ? <div className="small text-muted">{u.email}</div> : null}
            </td>
            <td>
              <span className={`badge ${u.role === 'Admin' ? 'bg-primary' : 'bg-secondary'} rounded-pill px-2 py-1`}>
                {u.role}
              </span>
            </td>
            <td>
              <StatusBadge active={u.isActive} />
            </td>
            <td>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditing(u)}>
                <i className="bi bi-pencil me-1" /> Edit
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* User Modal */}
      <Modal open={editing !== null} title={editing === 'new' ? 'Create User Account' : 'Edit Staff Account'} onClose={() => setEditing(null)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
          {editing === 'new' ? (
            <div className="row g-2">
              <div className="col-sm-6">
                <FormField label="Username" required error={form.formState.errors.userName?.message}>
                  <input
                    className={`form-control ${form.formState.errors.userName ? 'is-invalid' : ''}`}
                    placeholder="e.g. rahul_sales"
                    {...form.register('userName')}
                  />
                </FormField>
              </div>
              <div className="col-sm-6">
                <FormField label="Initial Password" required error={form.formState.errors.password?.message}>
                  <input
                    type="password"
                    className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`}
                    placeholder="Min 6 characters"
                    {...form.register('password')}
                  />
                </FormField>
              </div>
            </div>
          ) : null}

          <FormField label="Full Name" required error={form.formState.errors.fullName?.message}>
            <input
              className={`form-control ${form.formState.errors.fullName ? 'is-invalid' : ''}`}
              placeholder="e.g. Rahul Sharma"
              {...form.register('fullName')}
            />
          </FormField>

          <div className="row g-2">
            <div className="col-sm-6">
              <FormField label="Email Address" error={form.formState.errors.email?.message}>
                <input
                  type="email"
                  className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`}
                  placeholder="e.g. staff@jewel.com"
                  {...form.register('email')}
                />
              </FormField>
            </div>
            <div className="col-sm-6">
              <FormField label="Phone Number" error={form.formState.errors.phoneNumber?.message}>
                <input
                  className={`form-control ${form.formState.errors.phoneNumber ? 'is-invalid' : ''}`}
                  placeholder="10-digit mobile"
                  {...form.register('phoneNumber')}
                />
              </FormField>
            </div>
          </div>

          <FormField label="System Security Role" required error={form.formState.errors.role?.message}>
            <select className={`form-select ${form.formState.errors.role ? 'is-invalid' : ''}`} {...form.register('role')}>
              <option value="Admin">Admin (Full System Access & Profit Reports)</option>
              <option value="SalesPerson">SalesPerson (POS Counter & Standard Inventory)</option>
            </select>
          </FormField>

          <div>
            <label className="form-label mb-2">
              Assigned Store Branches <span className="required-star">*</span>
            </label>
            {form.formState.errors.storeIds ? (
              <p className="field-error mb-2"><i className="bi bi-exclamation-circle-fill" /> {form.formState.errors.storeIds.message}</p>
            ) : null}
            <div className="p-3 bg-light rounded-3 border">
              <div className="row g-2">
                {stores.data?.map((s) => (
                  <div key={s.id} className="col-sm-6">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`storeCheck_${s.id}`}
                        checked={form.watch('storeIds')?.includes(s.id)}
                        onChange={(e) => {
                          const cur = form.getValues('storeIds') ?? []
                          form.setValue('storeIds', e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id))
                        }}
                      />
                      <label className="form-check-label small fw-semibold" htmlFor={`storeCheck_${s.id}`}>
                        {s.storeName} ({s.storeCode})
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {editing && editing !== 'new' ? (
            <div className="form-check form-switch mt-2">
              <input type="checkbox" className="form-check-input" id="usrActive" {...form.register('isActive')} />
              <label className="form-check-label fw-semibold" htmlFor="usrActive">
                Active Staff Member
              </label>
            </div>
          ) : null}

          <div className="app-modal-actions">
            <button type="button" className="btn btn-light border px-3" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save Staff Account'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function SettingsForm({ section }: { section: 'billing' | 'tax' | 'referrals' | 'business' }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.get })
  const [form, setForm] = useState<Settings | null>(null)
  const data = form ?? q.data

  const save = useMutation({
    mutationFn: () => settingsApi.update(data!),
    onSuccess: async () => {
      toast.success('Configuration parameters updated successfully')
      await qc.invalidateQueries({ queryKey: queryKeys.settings })
    },
    onError: (err) => toastApiError(err, 'Failed to save configuration'),
  })

  if (!data) return <PageHeader title="Settings Configuration" />
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm({ ...data, [key]: value })

  return (
    <form
      className="card-panel"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      {section === 'business' ? (
        <>
          <div className="form-section-title">
            <i className="bi bi-building text-gold" /> Business & Showroom Profile
          </div>
          <div className="form-grid">
            <FormField label="Shop / Enterprise Name" required>
              <input className="form-control" value={data.shopName} onChange={(e) => set('shopName', e.target.value)} />
            </FormField>
            <FormField label="Logo Image Path / URL">
              <input className="form-control" value={data.logoPath ?? ''} onChange={(e) => set('logoPath', e.target.value)} />
            </FormField>
            <FormField label="Showroom Mobile Contact">
              <input className="form-control" value={data.mobile ?? ''} onChange={(e) => set('mobile', e.target.value)} />
            </FormField>
            <FormField label="Showroom Email">
              <input className="form-control" value={data.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField label="GSTIN Registration Number">
              <input className="form-control" value={data.gstNumber ?? ''} onChange={(e) => set('gstNumber', e.target.value)} />
            </FormField>
            <FormField label="Physical Store Address" className="col-12">
              <textarea className="form-control" rows={2} value={data.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </FormField>
            <FormField label="Invoice Footer Note" className="col-12">
              <textarea className="form-control" rows={2} value={data.invoiceFooter ?? ''} onChange={(e) => set('invoiceFooter', e.target.value)} />
            </FormField>
            <FormField label="Return & Exchange Policy Notice" className="col-12">
              <textarea className="form-control" rows={2} value={data.returnPolicy ?? ''} onChange={(e) => set('returnPolicy', e.target.value)} />
            </FormField>
          </div>
          <div className="form-section-title mt-4">
            <i className="bi bi-whatsapp text-gold" /> WhatsApp Cloud API
          </div>
          <p className="small text-muted">Used to send automatic birthday wishes. Leave disabled if a provider is not configured — failed sends are logged and never block billing.</p>
          <div className="form-grid">
            <div className="col-12">
              <div className="form-check form-switch">
                <input type="checkbox" className="form-check-input" id="waEn" checked={Boolean(data.whatsAppEnabled)} onChange={(e) => set('whatsAppEnabled', e.target.checked)} />
                <label className="form-check-label fw-bold" htmlFor="waEn">Enable WhatsApp birthday messages</label>
              </div>
            </div>
            <FormField label="Phone number ID">
              <input className="form-control" value={data.whatsAppPhoneNumberId ?? ''} onChange={(e) => set('whatsAppPhoneNumberId', e.target.value)} />
            </FormField>
            <FormField label="Access token" hint="Leave as ******** to keep the stored token.">
              <input className="form-control" type="password" value={data.whatsAppAccessToken ?? ''} onChange={(e) => set('whatsAppAccessToken', e.target.value)} />
            </FormField>
            <FormField label="API base URL" hint="Defaults to https://graph.facebook.com/v21.0">
              <input className="form-control" value={data.whatsAppApiBaseUrl ?? ''} onChange={(e) => set('whatsAppApiBaseUrl', e.target.value)} placeholder="https://graph.facebook.com/v21.0" />
            </FormField>
          </div>
        </>
      ) : null}

      {section === 'billing' ? (
        <>
          <div className="form-section-title">
            <i className="bi bi-receipt-cutoff text-gold" /> Invoicing & Inventory Policy
          </div>
          <div className="form-grid">
            <FormField label="Global Invoice Prefix">
              <input className="form-control" value={data.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} />
            </FormField>
            <FormField label="Invoice Numbering Format">
              <input className="form-control" value={data.invoiceNumberFormat} onChange={(e) => set('invoiceNumberFormat', e.target.value)} />
            </FormField>
            <FormField label="Financial Year Start Month (1-12)">
              <input className="form-control" type="number" min={1} max={12} value={data.financialYearStartMonth} onChange={(e) => set('financialYearStartMonth', Number(e.target.value))} />
            </FormField>
            <FormField label="Default Low Stock Threshold">
              <input className="form-control" type="number" min={0} value={data.lowStockDefaultLevel} onChange={(e) => set('lowStockDefaultLevel', Number(e.target.value))} />
            </FormField>
            <div className="col-12 mt-2">
              <div className="form-check form-switch">
                <input type="checkbox" className="form-check-input" id="negStock" checked={data.allowNegativeStock} onChange={(e) => set('allowNegativeStock', e.target.checked)} />
                <label className="form-check-label fw-semibold" htmlFor="negStock">
                  Allow Negative Stock Billing (Allows counter billing even when physical inventory reads zero)
                </label>
              </div>
            </div>
          </div>
          <div className="form-section-title mt-4">
            <i className="bi bi-arrow-repeat text-gold" /> Return / Exchange / Buyback deduction
          </div>
          <p className="small text-muted mb-3">
            These percentages are set by admin and applied automatically. Counter staff cannot type a custom deduction amount.
            Credit given to the customer = original item value minus this deduction.
          </p>
          <div className="form-grid">
            <FormField label="Return deduction %" hint="Example: 10% means a ₹5,150 return credits ₹4,635.">
              <input
                className="form-control"
                type="number"
                min={0}
                max={100}
                step="any"
                value={data.returnDeductionPercent ?? 0}
                onChange={(e) => set('returnDeductionPercent', Number(e.target.value))}
              />
            </FormField>
            <FormField label="Exchange deduction %" hint="Applied to the original item value when exchanging on a new bill.">
              <input
                className="form-control"
                type="number"
                min={0}
                max={100}
                step="any"
                value={data.exchangeDeductionPercent ?? 0}
                onChange={(e) => set('exchangeDeductionPercent', Number(e.target.value))}
              />
            </FormField>
            <FormField label="Buyback deduction %" hint="Counter buyback value is calculated from this setting, not entered by staff.">
              <input
                className="form-control"
                type="number"
                min={0}
                max={100}
                step="any"
                value={data.buybackDeductionPercent ?? 0}
                onChange={(e) => set('buybackDeductionPercent', Number(e.target.value))}
              />
            </FormField>
          </div>
        </>
      ) : null}

      {section === 'tax' ? (
        <>
          <div className="form-section-title">
            <i className="bi bi-percent text-gold" /> GST & Tax Schedules
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <FormField label="Default Standard Tax %">
                <input className="form-control" type="number" step="any" value={data.defaultTaxPercent} onChange={(e) => set('defaultTaxPercent', Number(e.target.value))} />
              </FormField>
            </div>
          </div>
          <div className="p-3 bg-light rounded-3">
            <h3 className="h6 fw-bold mb-3">Tax Slab Schedulers</h3>
            {data.taxSettings.map((t, i) => (
              <div key={t.id || i} className="row g-2 mb-2 align-items-center">
                <div className="col-sm-7">
                  <input
                    className="form-control"
                    placeholder="Tax Slab Name (e.g. Jewellery GST 3%)"
                    value={t.name}
                    onChange={(e) => {
                      const next = data.taxSettings.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x))
                      set('taxSettings', next)
                    }}
                  />
                </div>
                <div className="col-sm-5">
                  <div className="input-group">
                    <input
                      className="form-control"
                      type="number"
                      step="any"
                      placeholder="Tax %"
                      value={t.percent}
                      onChange={(e) => {
                        const next = data.taxSettings.map((x, idx) => (idx === i ? { ...x, percent: Number(e.target.value) } : x))
                        set('taxSettings', next)
                      }}
                    />
                    <span className="input-group-text">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {section === 'referrals' ? (
        <>
          <div className="form-section-title">
            <i className="bi bi-gift text-gold" /> Customer Referral Scheme Settings
          </div>
          <div className="mb-3">
            <div className="form-check form-switch">
              <input type="checkbox" className="form-check-input" id="refEn" checked={data.referralEnabled} onChange={(e) => set('referralEnabled', e.target.checked)} />
              <label className="form-check-label fw-bold" htmlFor="refEn">
                Enable Automated Referral Rewards Program
              </label>
            </div>
          </div>
          <div className="form-grid">
            <FormField label={data.rewardType === 2 ? 'New customer referral discount (%)' : 'New customer welcome reward (₹)'} hint="Applied immediately on this first referred invoice only. Default 10% when type is percentage. Never auto-applied to future bills.">
              <input className="form-control" type="number" min={0} step="any" value={data.newCustomerReward} onChange={(e) => set('newCustomerReward', Number(e.target.value))} />
            </FormField>
            <FormField label={data.rewardType === 2 ? 'Referring customer benefit (%)' : 'Referrer member reward (₹)'} hint="Credited to the referring customer's ledger/wallet, linked to this invoice. Default 5% when type is percentage.">
              <input className="form-control" type="number" min={0} step="any" value={data.referrerReward} onChange={(e) => set('referrerReward', Number(e.target.value))} />
            </FormField>
            <FormField label="Birthday offer default (%)" hint="Used only as the default value when seeding a new store birthday offer. Actual POS discounts come from Birthday Offers and must be selected on the bill.">
              <input className="form-control" type="number" min={0} max={100} step="any" value={data.birthdayDiscountPercent ?? 0} onChange={(e) => set('birthdayDiscountPercent', Number(e.target.value))} />
            </FormField>
            <FormField label="Reward Calculation Type">
              <select className="form-select" value={data.rewardType} onChange={(e) => set('rewardType', Number(e.target.value))}>
                <option value={1}>Fixed Rupee Amount (₹)</option>
                <option value={2}>Percentage of Bill (%)</option>
              </select>
            </FormField>
            <FormField label="Reward Credit Trigger Event">
              <select className="form-select" value={data.rewardTrigger} onChange={(e) => set('rewardTrigger', Number(e.target.value))}>
                <option value={1}>First Completed Purchase Only</option>
                <option value={2}>Every Completed Purchase</option>
              </select>
            </FormField>
            <div className="col-12">
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="stRef" checked={data.referralStoreWise} onChange={(e) => set('referralStoreWise', e.target.checked)} />
                <label className="form-check-label small" htmlFor="stRef">
                  Restrict referrals within individual store branches
                </label>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
        <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving Configuration…' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}

export function BillingSettingsPage() {
  return (
    <>
      <PageHeader title="Billing & Invoicing Preferences" subtitle="Global prefixes, fiscal calendar, and stock policies" />
      <SettingsForm section="billing" />
    </>
  )
}

export function TaxSettingsPage() {
  return (
    <>
      <PageHeader title="Tax & GST Schedules" subtitle="Configure applicable jewelry GST rates and slabs" />
      <SettingsForm section="tax" />
    </>
  )
}

export function ReferralSettingsPage() {
  return (
    <>
      <PageHeader title="Referral Rewards Setup" subtitle="Automate loyalty incentives and referral bonuses" />
      <SettingsForm section="referrals" />
    </>
  )
}

export function BusinessSettingsPage() {
  return (
    <>
      <PageHeader title="Showroom Business Profile" subtitle="Company identity, header information, GSTIN, and receipts" />
      <SettingsForm section="business" />
    </>
  )
}

export function AuditPage() {
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20 }
  const q = useQuery({ queryKey: queryKeys.audit(query), queryFn: () => settingsApi.audit(query) })

  return (
    <>
      <PageHeader title="System Audit Logs" subtitle="Security log of user actions, modifications, and timestamps" />
      <DataTable loading={q.isLoading} columns={['Timestamp', 'User Name', 'Action Event', 'Entity / Record ID', 'Client IP Address']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((a) => (
          <tr key={a.id}>
            <td className="small text-muted">{formatDateTime(a.createdDate)}</td>
            <td><strong className="text-navy-900 font-monospace">@{a.userName}</strong></td>
            <td><span className="badge bg-light text-dark border">{a.action}</span></td>
            <td className="small">{a.entityName} <span className="text-muted">#{a.entityId}</span></td>
            <td className="font-monospace small text-muted">{a.ipAddress}</td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
