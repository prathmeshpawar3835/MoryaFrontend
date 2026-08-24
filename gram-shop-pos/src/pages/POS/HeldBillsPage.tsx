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
      toast.success('Held bill discarded')
      await qc.invalidateQueries({ queryKey: queryKeys.heldBills(selectedStoreId) })
    },
  })

  return (
    <>
      <PageHeader title="Held bills" subtitle="Resume a parked cart on the POS counter" />
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load held bills' : null} columns={['Reference', 'Store', 'Created', 'Items', 'Actions']} empty="No held bills">
        {q.data?.map((h) => (
          <tr key={h.id}>
            <td>{h.holdReference}</td>
            <td>{h.storeId}</td>
            <td>{formatDateTime(h.createdDate)}</td>
            <td>{h.items.length}</td>
            <td>
              <Link className="btn btn-sm btn-gold me-2" to={`/pos?held=${h.id}`}>Resume</Link>
              <ConfirmDialog title="Discard held bill?" body="This cannot be undone." danger confirmLabel="Discard" onConfirm={() => del.mutateAsync(h.id)}>
                {(open) => (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={open}>Delete</button>
                )}
              </ConfirmDialog>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
