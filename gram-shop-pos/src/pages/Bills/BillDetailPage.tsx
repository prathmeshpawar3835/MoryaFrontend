import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { billApi } from '../../api/billApi'
import { queryKeys } from '../../api/queryKeys'
import { PageHeader, ErrorState, PageLoader } from '../../components/common/Feedback'
import { InvoiceView } from '../../components/print/InvoiceView'
import { ConfirmDialog } from '../../components/common/Modal'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export function BillDetailPage() {
  const { id } = useParams()
  const billId = Number(id)
  const qc = useQueryClient()
  const q = useQuery({ queryKey: queryKeys.invoice(billId), queryFn: () => billApi.invoice(billId), enabled: Number.isFinite(billId) })
  const bill = useQuery({ queryKey: queryKeys.bill(billId), queryFn: () => billApi.get(billId), enabled: Number.isFinite(billId) })

  if (q.isLoading) return <PageLoader />
  if (q.isError || !q.data) return <ErrorState message="Invoice not found." />

  return (
    <>
      <PageHeader
        title={q.data.invoiceNumber}
        subtitle={q.data.storeName}
        actions={
          <>
            <button type="button" className="btn btn-gold" onClick={() => window.print()}>Print</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => void billApi.invoicePdf(billId)}>PDF</button>
            <Link className="btn btn-outline-secondary" to={`/returns/new?billId=${billId}`}>Return</Link>
            <Link className="btn btn-outline-secondary" to={`/returns/exchange?billId=${billId}`}>Exchange</Link>
            {bill.data && bill.data.status !== 4 ? (
              <ConfirmDialog title="Cancel bill?" body="Stock and ledgers will reverse. This cannot be undone from the UI." danger confirmLabel="Cancel bill" onConfirm={async () => {
                await billApi.cancel(billId, 'Cancelled from POS')
                toast.success('Bill cancelled')
                await qc.invalidateQueries({ queryKey: queryKeys.bill(billId) })
                await qc.invalidateQueries({ queryKey: queryKeys.invoice(billId) })
              }}>
                {(open) => <button type="button" className="btn btn-outline-danger" onClick={open}>Cancel bill</button>}
              </ConfirmDialog>
            ) : null}
          </>
        }
      />
      <div className="print-toolbar d-lg-none" />
      <InvoiceView invoice={q.data} />
    </>
  )
}
