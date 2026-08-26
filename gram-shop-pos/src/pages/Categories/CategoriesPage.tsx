import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/errors'
import { categoryApi } from '../../api/categoryApi'
import { queryKeys } from '../../api/queryKeys'
import { categorySchema } from '../../validators/schemas'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../constants/permissions'
import { PageHeader, SearchBox, StatusBadge } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { Modal } from '../../components/common/Modal'
import { FormField } from '../../components/common/FormField'
import type { Category } from '../../types'
import type { z } from 'zod'

type Form = z.infer<typeof categorySchema>

export function CategoriesPage() {
  const { user } = useAuth()
  const canWrite = canAccess(user?.role, 'categories.write')
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const q = useQuery({ queryKey: queryKeys.categories, queryFn: categoryApi.list })
  const form = useForm<Form>({
    resolver: zodResolver(categorySchema),
    mode: 'onTouched',
    values:
      editing && editing !== 'new'
        ? { name: editing.name, description: editing.description ?? '', isActive: editing.isActive }
        : { name: '', description: '', isActive: true },
  })

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (editing && editing !== 'new') {
        return categoryApi.update(editing.id, {
          name: values.name,
          description: values.description,
          isActive: values.isActive ?? true,
        })
      }
      return categoryApi.create({ name: values.name, description: values.description })
    },
    onSuccess: async () => {
      toast.success(editing === 'new' ? 'Category created successfully' : 'Category updated successfully')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: queryKeys.categories })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to save category')
    },
  })

  const rows = (q.data ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <PageHeader
        title="Product Categories"
        subtitle="Organize jewellery catalog by classifications, types, and collections"
        actions={
          canWrite ? (
            <button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>
              <i className="bi bi-plus-lg me-1" /> Add Category
            </button>
          ) : undefined
        }
      />

      <div className="filter-bar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search categories by name or description…" />
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load categories' : null}
        columns={['Category Name', 'Description', 'Active Status', 'Actions']}
      >
        {rows.map((c) => (
          <tr key={c.id}>
            <td>
              <span className="fw-bold text-navy-900">{c.name}</span>
            </td>
            <td>
              <span className="text-muted">{c.description || '—'}</span>
            </td>
            <td>
              <StatusBadge active={c.isActive} />
            </td>
            <td>
              {canWrite ? (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => setEditing(c)}
                  title="Edit Category"
                >
                  <i className="bi bi-pencil me-1" /> Edit
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add / Edit Category Modal */}
      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add New Category' : `Edit Category: ${typeof editing === 'object' && editing ? editing.name : ''}`}
        onClose={() => setEditing(null)}
      >
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
          <FormField
            label="Category Name"
            required
            error={form.formState.errors.name?.message}
          >
            <input
              className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. 1g Gold Necklaces, Bangles, Rings"
              {...form.register('name')}
            />
          </FormField>

          <FormField
            label="Description (Optional)"
            error={form.formState.errors.description?.message}
          >
            <textarea
              className="form-control"
              rows={3}
              placeholder="Optional notes or details about this product category"
              {...form.register('description')}
            />
          </FormField>

          {editing && editing !== 'new' ? (
            <div className="form-check form-switch mt-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="catActive"
                {...form.register('isActive')}
              />
              <label className="form-check-label fw-semibold" htmlFor="catActive">
                Active Category
              </label>
            </div>
          ) : null}

          <div className="app-modal-actions">
            <button type="button" className="btn btn-light border px-3" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-gold px-4" type="submit" disabled={save.isPending}>
              {save.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save Category'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
