import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { productSchema } from '../../validators/schemas'
import { productApi } from '../../api/productApi'
import { categoryApi } from '../../api/categoryApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, PageLoader, CurrencyDisplay } from '../../components/common/Feedback'
import { FormField } from '../../components/common/FormField'
import { getApiFieldErrors, toastApiError } from '../../utils/errors'
import { productImageSrc } from '../../utils/media'
import { ProductUnitsPanel } from './ProductUnitsPanel'
import type { z } from 'zod'

type Form = z.infer<typeof productSchema>

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { selectedStoreId, stores } = useStore()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const cats = useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.list })
  const existing = useQuery({
    queryKey: queryKeys.product(Number(id), selectedStoreId),
    queryFn: () => productApi.get(Number(id), selectedStoreId),
    enabled: isEdit,
  })

  const form = useForm<Form>({
    resolver: zodResolver(productSchema) as Resolver<Form>,
    mode: 'onTouched',
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
          weightGrams: existing.data.weightGrams ?? undefined,
          metal: existing.data.metal ?? '',
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
          weightGrams: undefined,
          metal: '',
        },
  })

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (isEdit) {
        const updated = await productApi.update(Number(id), {
          barcode: values.barcode || undefined,
          productName: values.productName,
          categoryId: values.categoryId,
          unit: values.unit,
          purchasePrice: values.purchasePrice,
          sellingPrice: values.sellingPrice,
          mrp: values.mrp,
          taxPercent: values.taxPercent,
          minimumStockLevel: values.minimumStockLevel,
          weightGrams: values.weightGrams || null,
          metal: values.metal || undefined,
          isActive: values.isActive ?? true,
        })
        if (imageFile) await productApi.uploadImage(Number(id), imageFile)
        return updated
      }
      const created = await productApi.create({
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
        weightGrams: values.weightGrams || null,
        metal: values.metal || undefined,
        openingStockStoreId: values.openingStockStoreId || undefined,
        openingStock: values.openingStock ?? 0,
      })
      if (imageFile) await productApi.uploadImage(created.id, imageFile)
      return created
    },
    onSuccess: async () => {
      toast.success(isEdit ? 'Product updated successfully' : 'Product created successfully')
      await qc.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to save product')
    },
  })

  if (isEdit && existing.isLoading) return <PageLoader label="Loading product specifications…" />

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit Product: ${existing.data?.productName ?? ''}` : 'Add New Product'}
        subtitle="Configure item codes, pricing tiers, GST tax rates, and inventory limits"
        actions={
          <Link to="/products" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> Back to Products
          </Link>
        }
      />

      <form className="card-panel" onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        {/* Basic Information Section */}
        <div className="mb-4">
          <div className="form-section-title">
            <i className="bi bi-info-circle text-gold" /> Basic Product Details
          </div>
          <div className="form-grid">
            <FormField
              label="Product SKU / Code"
              required
              error={form.formState.errors.productCode?.message}
            >
              <input
                className={`form-control ${form.formState.errors.productCode ? 'is-invalid' : ''}`}
                placeholder="e.g. RING-001"
                disabled={isEdit}
                {...form.register('productCode')}
              />
            </FormField>

            <FormField
              label="Product Name"
              required
              error={form.formState.errors.productName?.message}
            >
              <input
                className={`form-control ${form.formState.errors.productName ? 'is-invalid' : ''}`}
                placeholder="e.g. 1g Gold Plated Ring"
                {...form.register('productName')}
              />
            </FormField>

            <FormField
              label="Barcode / EAN"
              error={form.formState.errors.barcode?.message}
            >
              <input
                className={`form-control ${form.formState.errors.barcode ? 'is-invalid' : ''}`}
                placeholder="Optional scanner barcode"
                {...form.register('barcode')}
              />
            </FormField>

            <FormField
              label="Category"
              required
              error={form.formState.errors.categoryId?.message}
            >
              <select
                className={`form-select ${form.formState.errors.categoryId ? 'is-invalid' : ''}`}
                {...form.register('categoryId', { valueAsNumber: true })}
              >
                <option value={0}>Select Category</option>
                {cats.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Unit of Measurement"
              required
              error={form.formState.errors.unit?.message}
            >
              <input
                className={`form-control ${form.formState.errors.unit ? 'is-invalid' : ''}`}
                placeholder="e.g. PCS, GRAM, SET"
                {...form.register('unit')}
              />
            </FormField>

            <FormField label="Weight (grams)" error={form.formState.errors.weightGrams?.message}>
              <input
                className="form-control"
                type="number"
                step="any"
                min={0}
                placeholder="Optional"
                {...form.register('weightGrams', { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="Metal details" error={form.formState.errors.metal?.message}>
              <input className="form-control" placeholder="e.g. 22K Gold" {...form.register('metal')} />
            </FormField>

            <FormField label="Product image" hint="Optional. A default gold jewellery image is used when none is uploaded.">
              <input
                className="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </FormField>
          </div>
        </div>

        {/* Pricing & GST Section */}
        <div className="form-section mb-4">
          <div className="form-section-title">
            <i className="bi bi-currency-rupee text-gold" /> Pricing & Taxation
          </div>
          <div className="form-grid">
            <FormField
              label="Purchase Price (₹)"
              required
              error={form.formState.errors.purchasePrice?.message}
            >
              <input
                className={`form-control ${form.formState.errors.purchasePrice ? 'is-invalid' : ''}`}
                type="number"
                step="any"
                min={0}
                {...form.register('purchasePrice', { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Selling Price (₹)"
              required
              hint="Default for new tagged pieces. Each unique number can then have its own selling price."
              error={form.formState.errors.sellingPrice?.message}
            >
              <input
                className={`form-control ${form.formState.errors.sellingPrice ? 'is-invalid' : ''}`}
                type="number"
                step="any"
                min={0}
                {...form.register('sellingPrice', { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Maximum Retail Price (MRP ₹)"
              required
              error={form.formState.errors.mrp?.message}
            >
              <input
                className={`form-control ${form.formState.errors.mrp ? 'is-invalid' : ''}`}
                type="number"
                step="any"
                min={0}
                {...form.register('mrp', { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="GST Tax Rate (%)"
              required
              error={form.formState.errors.taxPercent?.message}
            >
              <input
                className={`form-control ${form.formState.errors.taxPercent ? 'is-invalid' : ''}`}
                type="number"
                step="any"
                min={0}
                max={100}
                {...form.register('taxPercent', { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </div>

        {/* Stock & Inventory Section */}
        <div className="form-section mb-4">
          <div className="form-section-title">
            <i className="bi bi-boxes text-gold" /> Stock & Inventory Thresholds
          </div>
          <div className="form-grid">
            <FormField
              label="Minimum Stock Alert Level"
              hint="Triggers warning when store quantity drops below this."
              error={form.formState.errors.minimumStockLevel?.message}
            >
              <input
                className={`form-control ${form.formState.errors.minimumStockLevel ? 'is-invalid' : ''}`}
                type="number"
                step="any"
                min={0}
                {...form.register('minimumStockLevel', { valueAsNumber: true })}
              />
            </FormField>

            {!isEdit ? (
              <>
                <FormField
                  label="Initial Store Branch"
                  hint="Select store for initial opening stock."
                  error={form.formState.errors.openingStockStoreId?.message}
                >
                  <select
                    className="form-select"
                    {...form.register('openingStockStoreId', { valueAsNumber: true })}
                  >
                    <option value="">Select Store (Optional)</option>
                    {stores.map((s) => (
                      <option key={s.storeId} value={s.storeId}>
                        {s.storeName}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Opening Stock Quantity"
                  error={form.formState.errors.openingStock?.message}
                >
                  <input
                    className="form-control"
                    type="number"
                    step="any"
                    min={0}
                    {...form.register('openingStock', { valueAsNumber: true })}
                  />
                </FormField>
              </>
            ) : (
              <div className="d-flex align-items-center mt-3">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isActiveCheck"
                    {...form.register('isActive')}
                  />
                  <label className="form-check-label fw-bold" htmlFor="isActiveCheck">
                    Active Product in Catalog
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Server Level Errors */}
        {save.isError ? (
          <div className="alert alert-danger py-2 mb-3">
            {getApiFieldErrors(save.error).map((m) => (
              <div key={m} className="small"><i className="bi bi-exclamation-triangle-fill me-1" /> {m}</div>
            ))}
          </div>
        ) : null}

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2 pt-3 border-top">
          <Link to="/products" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button className="btn btn-gold px-4" type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving Product…
              </>
            ) : (
              <><i className="bi bi-check2 me-1" /> Save Product</>
            )}
          </button>
        </div>
      </form>
    </>
  )
}

export function ProductViewPage() {
  const { id } = useParams()
  const { selectedStoreId } = useStore()
  const q = useQuery({
    queryKey: queryKeys.product(Number(id), selectedStoreId),
    queryFn: () => productApi.get(Number(id), selectedStoreId),
  })

  if (!q.data) return <PageLoader label="Loading product specifications…" />
  const p = q.data

  return (
    <>
      <PageHeader
        title={p.productName}
        subtitle={`SKU: ${p.productCode} · Barcode: ${p.barcode || 'N/A'}`}
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-gold" to={`/products/edit/${p.id}`}>
              <i className="bi bi-pencil-square me-1" /> Edit Product
            </Link>
            <Link className="btn btn-outline-secondary" to="/products">
              <i className="bi bi-arrow-left me-1" /> All Products
            </Link>
          </div>
        }
      />

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card-panel h-100 text-center">
            <h2><i className="bi bi-image text-gold" /> Product Image</h2>
            <img
              src={productImageSrc(p.imagePath, p.imageUrl)}
              alt={p.productName}
              style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', background: '#12203c', borderRadius: 12 }}
            />
          </div>
        </div>
        <div className="col-md-8">
          <div className="card-panel h-100">
            <h2><i className="bi bi-info-circle text-gold" /> Specifications</h2>
            <table className="table app-table mb-0">
              <tbody>
                <tr>
                  <th className="text-muted" style={{ width: '40%' }}>Category</th>
                  <td className="fw-bold">{p.categoryName}</td>
                </tr>
                <tr>
                  <th className="text-muted">Unit</th>
                  <td>{p.unit}</td>
                </tr>
                <tr>
                  <th className="text-muted">Weight</th>
                  <td>{p.weightGrams ? `${p.weightGrams} g` : '—'}</td>
                </tr>
                <tr>
                  <th className="text-muted">Metal</th>
                  <td>{p.metal || '—'}</td>
                </tr>
                <tr>
                  <th className="text-muted">Status</th>
                  <td>
                    <span className={`badge ${p.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card-panel h-100">
            <h2><i className="bi bi-cash-stack text-gold" /> Pricing & Valuation</h2>
            <table className="table app-table mb-0">
              <tbody>
                <tr>
                  <th className="text-muted" style={{ width: '40%' }}>Purchase Price</th>
                  <td><CurrencyDisplay value={p.purchasePrice} /></td>
                </tr>
                <tr>
                  <th className="text-muted">Selling Price</th>
                  <td className="fw-bold text-navy-900"><CurrencyDisplay value={p.sellingPrice} /></td>
                </tr>
                <tr>
                  <th className="text-muted">MRP</th>
                  <td><CurrencyDisplay value={p.mrp} /></td>
                </tr>
                <tr>
                  <th className="text-muted">GST Rate</th>
                  <td>{p.taxPercent}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12">
          <div className="card-panel">
            <h2><i className="bi bi-boxes text-gold" /> Inventory Details</h2>
            <div className="d-flex gap-4 p-3 bg-light rounded-3">
              <div>
                <span className="text-muted small d-block">Available Store Stock</span>
                <strong className="fs-4 text-navy-900">{p.stockQuantity ?? '0'} {p.unit}</strong>
              </div>
              <div className="border-start ps-4">
                <span className="text-muted small d-block">Minimum Stock Level</span>
                <strong className="fs-4 text-muted">{p.minimumStockLevel} {p.unit}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductUnitsPanel productId={p.id} />
    </>
  )
}
