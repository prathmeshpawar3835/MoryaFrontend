import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { posApi } from '../../api/posApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { formatDateTime } from '../../utils/format'
import { ConfirmDialog } from '../../components/common/Modal'

export function HeldBillsPage() {
  const { selectedStoreId } = useStore()
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: queryKeys.heldBills(selectedStoreId),
    queryFn: () => posApi.heldList(selectedStoreId),
  })
  const del = useMutation({
    mutationFn: (id: number) => posApi.deleteHeld(id),
    onSuccess: async () => {
      toast.success('Held bill discarded successfully')
      await qc.invalidateQueries({ queryKey: queryKeys.heldBills(selectedStoreId) })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to discard held bill')
    },
  })

  return (
    <>
      <PageHeader
        title="Parked / Held Bills"
        subtitle="Resume a temporarily suspended bill or discard uncompleted carts"
        actions={
          <Link to="/pos" className="btn btn-gold">
            <i className="bi bi-plus-lg me-1" /> Open POS Terminal
          </Link>
        }
      />
      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load parked bills' : null}
        columns={['Reference / Note', 'Store ID', 'Created At', 'Cart Items', 'Actions']}
        empty="No parked bills found for this store counter"
      >
        {q.data?.map((h) => (
          <tr key={h.id}>
            <td>
              <strong className="text-dark">{h.holdReference || `Parked Cart #${h.id}`}</strong>
              {h.notes ? <div className="small text-muted">{h.notes}</div> : null}
            </td>
            <td>
              <span className="badge bg-light text-dark border">Store #{h.storeId}</span>
            </td>
            <td className="small text-muted">{formatDateTime(h.createdDate)}</td>
            <td>
              <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-1">
                {h.items.length} item(s)
              </span>
            </td>
            <td>
              <Link className="btn btn-sm btn-gold me-2" to={`/pos?held=${h.id}`}>
                <i className="bi bi-play-circle me-1" /> Resume
              </Link>
              <ConfirmDialog
                title="Discard Parked Bill?"
                body="This parked cart will be permanently deleted from the queue. This action cannot be undone."
                danger
                confirmLabel="Discard Bill"
                onConfirm={() => del.mutateAsync(h.id)}
              >
                {(open) => (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={open}>
                    <i className="bi bi-trash me-1" /> Delete
                  </button>
                )}
              </ConfirmDialog>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
