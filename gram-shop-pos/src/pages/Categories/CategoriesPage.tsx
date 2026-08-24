import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoryApi } from '../../api/categoryApi'
import { queryKeys } from '../../api/queryKeys'
import { categorySchema } from '../../validators/schemas'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../constants/permissions'
import { PageHeader, SearchBox, StatusBadge } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { Modal } from '../../components/common/Modal'
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
  const form = useForm<Form>({ resolver: zodResolver(categorySchema), values: editing && editing !== 'new' ? { name: editing.name, description: editing.description ?? '', isActive: editing.isActive } : { name: '', description: '', isActive: true } })

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (editing && editing !== 'new') {
        return categoryApi.update(editing.id, { name: values.name, description: values.description, isActive: values.isActive ?? true })
      }
      return categoryApi.create({ name: values.name, description: values.description })
    },
    onSuccess: async () => {
      toast.success('Category saved')
      setEditing(null)
      await qc.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  const rows = (q.data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <PageHeader title="Categories" actions={canWrite ? <button className="btn btn-gold" type="button" onClick={() => setEditing('new')}>Add category</button> : undefined} />
      <div className="filter-bar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search categories" />
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load categories' : null} columns={['Name', 'Description', 'Status', 'Actions']}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.description}</td>
            <td><StatusBadge active={c.isActive} /></td>
            <td>
              {canWrite ? (
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setEditing(c)}>Edit</button>
              ) : null}
            </td>
          </tr>
        ))}
      </DataTable>
      <Modal open={editing !== null} title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)}>
        <form className="stack-form" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <label>Name<input className="form-control" {...form.register('name')} /></label>
          <label>Description<input className="form-control" {...form.register('description')} /></label>
          {editing && editing !== 'new' ? (
            <label className="form-check"><input type="checkbox" className="form-check-input" {...form.register('isActive')} /> Active</label>
          ) : null}
          <button className="btn btn-gold" type="submit">Save</button>
        </form>
      </Modal>
    </>
  )
}
