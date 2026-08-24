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
import { formatDateTime } from '../../utils/format'
import type { Settings, Store, User } from '../../types'
import type { z } from 'zod'

type StoreForm = z.infer<typeof storeSchema>
type UserForm = z.infer<typeof userSchema>

export function StoresSettingsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: queryKeys.stores, queryFn: storeApi.list })
  const [editing, setEditing] = useState<Store | 'new' | null>(null)
  const form = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    values: editing && editing !== 'new'
      ? { storeCode: editing.storeCode, storeName: editing.storeName, address: editing.address ?? '', contactNumber: editing.contactNumber ?? '', gstNumber: editing.gstNumber ?? '', invoicePrefix: editing.invoicePrefix ?? '', isActive: editing.isActive }
      : { storeCode: '', storeName: '', address: '', contactNumber: '', gstNumber: '', invoicePrefix: '', isActive: true },
  })
  const save = useMutation({
    mutationFn: (v: StoreForm) =>
      editing && editing !== 'new'
        ? storeApi.update(editing.id, { ...v, isActive: v.isActive ?? true })
        : storeApi.create(v),
    onSuccess: async () => {
      toast.success('Store saved')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: queryKeys.stores })
    },
  })
  return (
    <>
      <PageHeader title="Stores" actions={<button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>Add store</button>} />
      <DataTable loading={q.isLoading} columns={['Code', 'Name', 'GST', 'Status', 'Actions']}>
        {q.data?.map((s) => (
          <tr key={s.id}>
            <td>{s.storeCode}</td>
            <td>{s.storeName}</td>
            <td>{s.gstNumber}</td>
            <td><StatusBadge active={s.isActive} /></td>
            <td><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditing(s)}>Edit</button></td>
          </tr>
        ))}
      </DataTable>
      <Modal open={editing !== null} title={editing === 'new' ? 'Add store' : 'Edit store'} onClose={() => setEditing(null)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <label>Code<input className="form-control" {...form.register('storeCode')} /></label>
          <label>Name<input className="form-control" {...form.register('storeName')} /></label>
          <label>Address<input className="form-control" {...form.register('address')} /></label>
          <label>Contact<input className="form-control" {...form.register('contactNumber')} /></label>
          <label>GST<input className="form-control" {...form.register('gstNumber')} /></label>
          <label>Invoice prefix<input className="form-control" {...form.register('invoicePrefix')} /></label>
          {editing && editing !== 'new' ? <label className="form-check"><input type="checkbox" className="form-check-input" {...form.register('isActive')} /> Active</label> : null}
          <button className="btn btn-gold" type="submit">Save</button>
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
    values: editing && editing !== 'new'
      ? { userName: editing.userName, fullName: editing.fullName, email: editing.email ?? '', phoneNumber: editing.phoneNumber ?? '', role: editing.role, storeIds: editing.storeIds, isActive: editing.isActive, password: '' }
      : { userName: '', password: '', fullName: '', email: '', phoneNumber: '', role: 'SalesPerson', storeIds: [], isActive: true },
  })
  const save = useMutation({
    mutationFn: (v: UserForm) => {
      if (editing && editing !== 'new') {
        return userApi.update(editing.id, { fullName: v.fullName, email: v.email || undefined, phoneNumber: v.phoneNumber, role: v.role, isActive: v.isActive ?? true, storeIds: v.storeIds })
      }
      return userApi.create({ userName: v.userName, password: v.password || '', fullName: v.fullName, email: v.email || undefined, phoneNumber: v.phoneNumber, role: v.role, storeIds: v.storeIds })
    },
    onSuccess: async () => {
      toast.success('User saved')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
  return (
    <>
      <PageHeader title="Users" actions={<button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>Create user</button>} />
      <div className="filter-bar"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} /></div>
      <DataTable loading={q.isLoading} columns={['User', 'Name', 'Role', 'Status', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((u) => (
          <tr key={u.id}>
            <td>{u.userName}</td>
            <td>{u.fullName}</td>
            <td>{u.role}</td>
            <td><StatusBadge active={u.isActive} /></td>
            <td><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditing(u)}>Edit</button></td>
          </tr>
        ))}
      </DataTable>
      <Modal open={editing !== null} title={editing === 'new' ? 'Create user' : 'Edit user'} onClose={() => setEditing(null)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          {editing === 'new' ? <label>User name<input className="form-control" {...form.register('userName')} /></label> : null}
          {editing === 'new' ? <label>Password<input type="password" className="form-control" {...form.register('password')} /></label> : null}
          <label>Full name<input className="form-control" {...form.register('fullName')} /></label>
          <label>Email<input className="form-control" {...form.register('email')} /></label>
          <label>Phone<input className="form-control" {...form.register('phoneNumber')} /></label>
          <label>Role<select className="form-select" {...form.register('role')}><option>Admin</option><option>SalesPerson</option></select></label>
          <fieldset>
            <legend className="small">Stores</legend>
            {stores.data?.map((s) => (
              <label key={s.id} className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.watch('storeIds')?.includes(s.id)}
                  onChange={(e) => {
                    const cur = form.getValues('storeIds') ?? []
                    form.setValue('storeIds', e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id))
                  }}
                /> {s.storeName}
              </label>
            ))}
          </fieldset>
          {editing && editing !== 'new' ? <label className="form-check"><input type="checkbox" className="form-check-input" {...form.register('isActive')} /> Active</label> : null}
          <button className="btn btn-gold" type="submit">Save</button>
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
      toast.success('Settings saved')
      await qc.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
  if (!data) return <PageHeader title="Settings" />
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm({ ...data, [key]: value })
  return (
    <form className="card-panel form-grid" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
      {section === 'business' ? (
        <>
          <label>Shop name<input className="form-control" value={data.shopName} onChange={(e) => set('shopName', e.target.value)} /></label>
          <label>Logo path<input className="form-control" value={data.logoPath ?? ''} onChange={(e) => set('logoPath', e.target.value)} /></label>
          <label>Address<input className="form-control" value={data.address ?? ''} onChange={(e) => set('address', e.target.value)} /></label>
          <label>Mobile<input className="form-control" value={data.mobile ?? ''} onChange={(e) => set('mobile', e.target.value)} /></label>
          <label>Email<input className="form-control" value={data.email ?? ''} onChange={(e) => set('email', e.target.value)} /></label>
          <label>GST number<input className="form-control" value={data.gstNumber ?? ''} onChange={(e) => set('gstNumber', e.target.value)} /></label>
          <label>Invoice footer<textarea className="form-control" value={data.invoiceFooter ?? ''} onChange={(e) => set('invoiceFooter', e.target.value)} /></label>
          <label>Return policy<textarea className="form-control" value={data.returnPolicy ?? ''} onChange={(e) => set('returnPolicy', e.target.value)} /></label>
        </>
      ) : null}
      {section === 'billing' ? (
        <>
          <label>Invoice prefix<input className="form-control" value={data.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} /></label>
          <label>Number format<input className="form-control" value={data.invoiceNumberFormat} onChange={(e) => set('invoiceNumberFormat', e.target.value)} /></label>
          <label>FY start month<input className="form-control" type="number" value={data.financialYearStartMonth} onChange={(e) => set('financialYearStartMonth', Number(e.target.value))} /></label>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={data.allowNegativeStock} onChange={(e) => set('allowNegativeStock', e.target.checked)} /> Allow negative stock</label>
          <label>Low stock default<input className="form-control" type="number" value={data.lowStockDefaultLevel} onChange={(e) => set('lowStockDefaultLevel', Number(e.target.value))} /></label>
        </>
      ) : null}
      {section === 'tax' ? (
        <>
          <label>Default tax %<input className="form-control" type="number" value={data.defaultTaxPercent} onChange={(e) => set('defaultTaxPercent', Number(e.target.value))} /></label>
          <div className="w-100">
            {data.taxSettings.map((t, i) => (
              <div key={t.id || i} className="d-flex gap-2 mb-2">
                <input className="form-control" value={t.name} onChange={(e) => {
                  const next = data.taxSettings.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x)
                  set('taxSettings', next)
                }} />
                <input className="form-control" type="number" value={t.percent} onChange={(e) => {
                  const next = data.taxSettings.map((x, idx) => idx === i ? { ...x, percent: Number(e.target.value) } : x)
                  set('taxSettings', next)
                }} />
              </div>
            ))}
          </div>
        </>
      ) : null}
      {section === 'referrals' ? (
        <>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={data.referralEnabled} onChange={(e) => set('referralEnabled', e.target.checked)} /> Enable referrals</label>
          <label>New customer reward<input className="form-control" type="number" value={data.newCustomerReward} onChange={(e) => set('newCustomerReward', Number(e.target.value))} /></label>
          <label>Referrer reward<input className="form-control" type="number" value={data.referrerReward} onChange={(e) => set('referrerReward', Number(e.target.value))} /></label>
          <label>Reward type<select className="form-select" value={data.rewardType} onChange={(e) => set('rewardType', Number(e.target.value))}><option value={1}>Fixed amount</option><option value={2}>Percentage</option></select></label>
          <label>Trigger<select className="form-select" value={data.rewardTrigger} onChange={(e) => set('rewardTrigger', Number(e.target.value))}><option value={1}>First purchase</option><option value={2}>Every purchase</option></select></label>
          <label className="form-check"><input type="checkbox" className="form-check-input" checked={data.referralStoreWise} onChange={(e) => set('referralStoreWise', e.target.checked)} /> Store-wise referrals</label>
        </>
      ) : null}
      <div><button className="btn btn-gold" type="submit">Save settings</button></div>
    </form>
  )
}

export function BillingSettingsPage() { return <><PageHeader title="Billing settings" /><SettingsForm section="billing" /></> }
export function TaxSettingsPage() { return <><PageHeader title="Tax / GST" /><SettingsForm section="tax" /></> }
export function ReferralSettingsPage() { return <><PageHeader title="Referral settings" /><SettingsForm section="referrals" /></> }
export function BusinessSettingsPage() { return <><PageHeader title="Business profile" /><SettingsForm section="business" /></> }

export function AuditPage() {
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20 }
  const q = useQuery({ queryKey: queryKeys.audit(query), queryFn: () => settingsApi.audit(query) })
  return (
    <>
      <PageHeader title="Audit logs" />
      <DataTable loading={q.isLoading} columns={['Date', 'User', 'Action', 'Entity', 'IP']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((a) => (
          <tr key={a.id}>
            <td>{formatDateTime(a.createdDate)}</td>
            <td>{a.userName}</td>
            <td>{a.action}</td>
            <td>{a.entityName} {a.entityId}</td>
            <td>{a.ipAddress}</td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
