import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { productSchema } from '../../validators/schemas'
import { productApi } from '../../api/productApi'
import { categoryApi } from '../../api/categoryApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, PageLoader } from '../../components/common/Feedback'
import { getApiFieldErrors } from '../../utils/errors'
import type { z } from 'zod'

type Form = z.infer<typeof productSchema>

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { selectedStoreId, stores } = useStore()
  const cats = useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.list })
  const existing = useQuery({
    queryKey: queryKeys.product(Number(id), selectedStoreId),
    queryFn: () => productApi.get(Number(id), selectedStoreId),
    enabled: isEdit,
  })
  const form = useForm<Form>({
    resolver: zodResolver(productSchema) as Resolver<Form>,
    values: existing.data
      ? {
          productCode: existing.data.productCode,
          productName: existing.data.productName,
          barcode: existing.data.barcode ?? '',
          categoryId: existing.data.categoryId,
          unit: existing.data.unit,
          purchasePrice: existing.data.purchasePrice,
          sellingPrice: existing.data.sellingPrice,
          mrp: existing.data.mrp,
          taxPercent: existing.data.taxPercent,
          minimumStockLevel: existing.data.minimumStockLevel,
          isActive: existing.data.isActive,
          openingStock: 0,
          openingStockStoreId: selectedStoreId,
        }
      : {
          productCode: '',
          productName: '',
          barcode: '',
          categoryId: 0,
          unit: 'PCS',
          purchasePrice: 0,
          sellingPrice: 0,
          mrp: 0,
          taxPercent: 3,
          minimumStockLevel: 0,
          openingStock: 0,
          openingStockStoreId: selectedStoreId,
          isActive: true,
        },
  })

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (isEdit) {
        return productApi.update(Number(id), {
          barcode: values.barcode || undefined,
          productName: values.productName,
          categoryId: values.categoryId,
          unit: values.unit,
          purchasePrice: values.purchasePrice,
          sellingPrice: values.sellingPrice,
          mrp: values.mrp,
          taxPercent: values.taxPercent,
          minimumStockLevel: values.minimumStockLevel,
          isActive: values.isActive ?? true,
        })
      }
      return productApi.create({
        productCode: values.productCode,
        barcode: values.barcode || undefined,
        productName: values.productName,
        categoryId: values.categoryId,
        unit: values.unit,
        purchasePrice: values.purchasePrice,
        sellingPrice: values.sellingPrice,
        mrp: values.mrp,
        taxPercent: values.taxPercent,
        minimumStockLevel: values.minimumStockLevel,
        openingStockStoreId: values.openingStockStoreId || undefined,
        openingStock: values.openingStock ?? 0,
      })
    },
    onSuccess: async () => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      await qc.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
  })

  if (isEdit && existing.isLoading) return <PageLoader />

  return (
    <>
      <PageHeader title={isEdit ? 'Edit product' : 'Create product'} />
      <form className="card-panel form-grid" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        {!isEdit ? (
          <label>Product code<input className="form-control" {...form.register('productCode')} /></label>
        ) : (
          <label>Product code<input className="form-control" disabled value={existing.data?.productCode} /></label>
        )}
        <label>Product name<input className="form-control" {...form.register('productName')} /></label>
        <label>Barcode<input className="form-control" {...form.register('barcode')} /></label>
        <label>
          Category
          <select className="form-select" {...form.register('categoryId', { valueAsNumber: true })}>
            <option value={0}>Select</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Unit<input className="form-control" {...form.register('unit')} /></label>
        <label>Purchase price<input className="form-control" type="number" step="any" {...form.register('purchasePrice', { valueAsNumber: true })} /></label>
        <label>Selling price<input className="form-control" type="number" step="any" {...form.register('sellingPrice', { valueAsNumber: true })} /></label>
        <label>MRP<input className="form-control" type="number" step="any" {...form.register('mrp', { valueAsNumber: true })} /></label>
        <label>GST %<input className="form-control" type="number" step="any" {...form.register('taxPercent', { valueAsNumber: true })} /></label>
        <label>Minimum stock<input className="form-control" type="number" step="any" {...form.register('minimumStockLevel', { valueAsNumber: true })} /></label>
        {!isEdit ? (
          <>
            <label>
              Opening stock store
              <select className="form-select" {...form.register('openingStockStoreId', { valueAsNumber: true })}>
                <option value="">None</option>
                {stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}
              </select>
            </label>
            <label>Opening stock<input className="form-control" type="number" step="any" {...form.register('openingStock', { valueAsNumber: true })} /></label>
          </>
        ) : (
          <label className="form-check align-self-end">
            <input type="checkbox" className="form-check-input" {...form.register('isActive')} /> Active
          </label>
        )}
        {Object.values(form.formState.errors).map((e) => e?.message ? <small key={String(e.message)} className="text-danger">{String(e.message)}</small> : null)}
        {save.isError ? getApiFieldErrors(save.error).map((m) => <small key={m} className="text-danger">{m}</small>) : null}
        <div>
          <button className="btn btn-gold" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </>
  )
}

export function ProductViewPage() {
  const { id } = useParams()
  const { selectedStoreId } = useStore()
  const q = useQuery({ queryKey: queryKeys.product(Number(id), selectedStoreId), queryFn: () => productApi.get(Number(id), selectedStoreId) })
  if (!q.data) return <PageLoader />
  const p = q.data
  return (
    <>
      <PageHeader title={p.productName} subtitle={p.productCode} actions={<Link className="btn btn-gold" to={`/products/edit/${p.id}`}>Edit</Link>} />
      <div className="card-panel">
        <p>Barcode {p.barcode || '—'}</p>
        <p>Category {p.categoryName} · Unit {p.unit}</p>
        <p>Purchase {p.purchasePrice} · Selling {p.sellingPrice} · MRP {p.mrp} · GST {p.taxPercent}%</p>
        <p>Stock {p.stockQuantity ?? '—'} · Min {p.minimumStockLevel}</p>
      </div>
    </>
  )
}
