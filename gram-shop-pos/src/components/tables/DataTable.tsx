import type { ReactNode } from 'react'
import { EmptyState, ErrorState, Pagination } from '../common/Feedback'

export function DataTable({
  loading,
  error,
  empty,
  columns,
  children,
  page,
  totalPages,
  onPage,
}: {
  loading?: boolean
  error?: string | null
  empty?: string
  columns: string[]
  children: ReactNode
  page?: number
  totalPages?: number
  onPage?: (page: number) => void
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)

  return (
    <div className="table-shell">
      <div className="table-responsive">
        <table className="table app-table mb-0 align-middle">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={`${c}-${i}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, row) => (
                <tr key={`skel-${row}`}>
                  {columns.map((c, i) => (
                    <td key={`${c}-${i}`}>
                      <div className="skel skel-line" style={{ width: row % 2 ? '64%' : '82%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <ErrorState message={error} />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={empty ?? 'No records found'} hint="Try changing your search filters or add a new record." />
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {page && totalPages && onPage ? <Pagination page={page} totalPages={totalPages} onPage={onPage} /> : null}
    </div>
  )
}
