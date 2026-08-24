import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
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
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined, categoryId: categoryId || undefined, lowStockOnly: lowStockOnly || undefined }
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
        isActive: !p.isActive,
      })
    },
    onSuccess: async () => {
      toast.success('Product status updated')
      await qc.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return (
    <>
      <PageHeader
        title="Products"
        actions={canWrite ? <Link className="btn btn-gold" to="/products/create">Add product</Link> : undefined}
      />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Name, code or barcode" />
        <StoreSelector />
        <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All categories</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="form-check">
          <input className="form-check-input" type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock
        </label>
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load products' : null} columns={['Code', 'Barcode', 'Name', 'Category', 'Purchase', 'Selling', 'MRP', 'GST', 'Stock', 'Status', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td>{p.productCode}</td>
            <td>{p.barcode || '—'}</td>
            <td>{p.productName}</td>
            <td>{p.categoryName}</td>
            <td><CurrencyDisplay value={p.purchasePrice} /></td>
            <td><CurrencyDisplay value={p.sellingPrice} /></td>
            <td><CurrencyDisplay value={p.mrp} /></td>
            <td>{p.taxPercent}%</td>
            <td>{p.stockQuantity ?? '—'}</td>
            <td><StatusBadge active={p.isActive} /></td>
            <td>
              <Link className="btn btn-sm btn-outline-secondary me-1" to={`/products/${p.id}`}>View</Link>
              {canWrite ? (
                <>
                  <Link className="btn btn-sm btn-outline-secondary me-1" to={`/products/edit/${p.id}`}>Edit</Link>
                  <ConfirmDialog title={p.isActive ? 'Deactivate product?' : 'Activate product?'} body="Products are never hard-deleted from this screen." onConfirm={() => deactivate.mutateAsync(p.id)}>
                    {(open) => <button type="button" className="btn btn-sm btn-outline-secondary" onClick={open}>{p.isActive ? 'Deactivate' : 'Activate'}</button>}
                  </ConfirmDialog>
                </>
              ) : null}
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
