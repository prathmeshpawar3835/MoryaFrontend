import type { ReactNode } from 'react'
import { EmptyState, ErrorState, LoadingSpinner, Pagination } from '../common/Feedback'

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
  return (
    <div className="table-shell">
      <div className="table-responsive">
        <table className="table app-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length}>
                  <ErrorState message={error} />
                </td>
              </tr>
            ) : !children || (Array.isArray(children) && children.length === 0) ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={empty ?? 'No records found'} />
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
