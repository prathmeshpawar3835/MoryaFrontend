import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/errors'
import { productApi } from '../../api/productApi'
import { categoryApi } from '../../api/categoryApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../constants/permissions'
import { PageHeader, SearchBox, CurrencyDisplay, StatusBadge } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { ConfirmDialog } from '../../components/common/Modal'

export function ProductsPage() {
  const { selectedStoreId } = useStore()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const cats = useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.list })
  const query = {
    pageNumber: page,
    pageSize: 20,
    search,
    storeId: selectedStoreId ?? undefined,
    categoryId: categoryId || undefined,
    lowStockOnly: lowStockOnly || undefined,
  }
  const q = useQuery({ queryKey: queryKeys.products(query), queryFn: () => productApi.list(query) })
  const canWrite = canAccess(user?.role, 'products.write')

  const deactivate = useMutation({
    mutationFn: async (id: number) => {
      const p = await productApi.get(id, selectedStoreId)
      await productApi.update(id, {
        barcode: p.barcode ?? undefined,
        productName: p.productName,
        categoryId: p.categoryId,
        unit: p.unit,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        taxPercent: p.taxPercent,
        minimumStockLevel: p.minimumStockLevel,
        weightGrams: p.weightGrams,
        metal: p.metal ?? undefined,
        isActive: !p.isActive,
      })
    },
    onSuccess: async () => {
      toast.success('Product status updated')
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to change product status')
    },
  })

  return (
    <>
      <PageHeader
        title="Products Catalog"
        subtitle="Manage jewellery items, pricing, barcodes, and inventory levels"
        actions={
          canWrite ? (
            <div className="page-header-actions">
              <Link className="btn btn-gold" to="/products/create">
                <i className="bi bi-plus-lg me-1" /> Add Product
              </Link>
              <Link className="btn btn-outline-secondary" to="/products/import">
                <i className="bi bi-file-earmark-excel me-1" /> Excel Import
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search by code, name or barcode…"
        />
        <StoreSelector />
        <select
          className="form-select"
          style={{ minWidth: '170px' }}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">All Categories</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="form-check form-switch ms-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="lowStockCheck"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          <label className="form-check-label fw-semibold small text-muted" htmlFor="lowStockCheck">
            Low Stock Alerts
          </label>
        </div>
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load products' : null}
        columns={['Code / SKU', 'Barcode', 'Product Name', 'Category', 'Purchase', 'Selling', 'MRP', 'Tax', 'Stock', 'Status', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td>
              <span className="fw-bold text-dark">{p.productCode}</span>
            </td>
            <td>
              <span className="small text-muted font-monospace">{p.barcode || '—'}</span>
            </td>
            <td>
              <span className="fw-semibold text-navy-900">{p.productName}</span>
            </td>
            <td>
              <span className="badge bg-light text-dark border">{p.categoryName}</span>
            </td>
            <td><CurrencyDisplay value={p.purchasePrice} /></td>
            <td className="fw-bold text-navy-900"><CurrencyDisplay value={p.sellingPrice} /></td>
            <td><CurrencyDisplay value={p.mrp} /></td>
            <td>{p.taxPercent}%</td>
            <td>
              <span className={`badge ${p.stockQuantity && p.stockQuantity > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill`}>
                {p.stockQuantity ?? 0} {p.unit}
              </span>
            </td>
            <td><StatusBadge active={p.isActive} /></td>
            <td>
              <div className="d-flex gap-1">
                <Link className="btn btn-sm btn-outline-secondary" to={`/products/${p.id}`} title="View Details">
                  <i className="bi bi-eye" />
                </Link>
                {canWrite ? (
                  <>
                    <Link className="btn btn-sm btn-outline-secondary" to={`/products/edit/${p.id}`} title="Edit Product">
                      <i className="bi bi-pencil" />
                    </Link>
                    <ConfirmDialog
                      title={p.isActive ? 'Deactivate Product?' : 'Activate Product?'}
                      body={`Are you sure you want to ${p.isActive ? 'deactivate' : 'activate'} ${p.productName}?`}
                      danger={p.isActive}
                      confirmLabel={p.isActive ? 'Deactivate' : 'Activate'}
                      onConfirm={() => deactivate.mutateAsync(p.id)}
                    >
                      {(open) => (
                        <button
                          type="button"
                          className={`btn btn-sm ${p.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={open}
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`bi ${p.isActive ? 'bi-slash-circle' : 'bi-check-circle'}`} />
                        </button>
                      )}
                    </ConfirmDialog>
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
