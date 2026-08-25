import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { billApi } from '../../api/billApi'
import { queryKeys } from '../../api/queryKeys'
import { PageHeader, ErrorState, PageLoader } from '../../components/common/Feedback'
import { InvoiceView } from '../../components/print/InvoiceView'
import { ConfirmDialog } from '../../components/common/Modal'
import toast from 'react-hot-toast'

export function BillDetailPage() {
  const { id } = useParams()
  const billId = Number(id)
  const qc = useQueryClient()
  const q = useQuery({ queryKey: queryKeys.invoice(billId), queryFn: () => billApi.invoice(billId), enabled: Number.isFinite(billId) })
  const bill = useQuery({ queryKey: queryKeys.bill(billId), queryFn: () => billApi.get(billId), enabled: Number.isFinite(billId) })

  if (q.isLoading) return <PageLoader label="Rendering invoice details…" />
  if (q.isError || !q.data) return <ErrorState message="Invoice not found or could not be loaded." />

  return (
    <>
      <PageHeader
        title={`Tax Invoice: ${q.data.invoiceNumber}`}
        subtitle={`Branch: ${q.data.storeName} · Created: ${q.data.invoiceDate}`}
        actions={
          <div className="page-header-actions">
            <button type="button" className="btn btn-gold" onClick={() => window.print()}>
              <i className="bi bi-printer me-1" /> Print Receipt
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => void billApi.invoicePdf(billId)}>
              <i className="bi bi-file-earmark-pdf me-1" /> Download PDF
            </button>
            <button type="button" className="btn btn-success" onClick={async () => {
              try {
                const share = await billApi.sendWhatsApp(billId)
                if (!share.shareUrl) {
                  toast.error(share.error || 'Invoice generated successfully, but WhatsApp sending failed.')
                  return
                }
                window.open(share.shareUrl, '_blank', 'noopener,noreferrer')
              } catch {
                toast.error('Invoice generated successfully, but WhatsApp sending failed.')
              }
            }}>
              <i className="bi bi-whatsapp me-1" /> Send Invoice on WhatsApp
            </button>
            <Link className="btn btn-outline-secondary" to={`/returns/new?billId=${billId}`}>
              <i className="bi bi-arrow-return-left me-1" /> Return
            </Link>
            <Link className="btn btn-outline-secondary" to={`/returns/exchange?billId=${billId}`}>
              <i className="bi bi-arrow-left-right me-1" /> Exchange
            </Link>
            <Link className="btn btn-outline-secondary" to={`/returns/buyback?billId=${billId}`}>
              <i className="bi bi-bag-check me-1" /> Buyback
            </Link>
            {bill.data && bill.data.status !== 4 ? (
              <ConfirmDialog
                title="Cancel Bill Transaction?"
                body="Stock quantities and customer ledger balances will be automatically reversed. This cancellation cannot be undone."
                danger
                confirmLabel="Yes, Cancel Bill"
                onConfirm={async () => {
                  try {
                    await billApi.cancel(billId, 'Cancelled from POS management')
                    toast.success('Bill cancelled and inventory reversed')
                    await qc.invalidateQueries({ queryKey: queryKeys.bill(billId) })
                    await qc.invalidateQueries({ queryKey: queryKeys.invoice(billId) })
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || 'Failed to cancel bill')
                  }
                }}
              >
                {(open) => (
                  <button type="button" className="btn btn-outline-danger" onClick={open}>
                    <i className="bi bi-x-circle me-1" /> Cancel Bill
                  </button>
                )}
              </ConfirmDialog>
            ) : null}
            <Link className="btn btn-light border" to="/bills">
              ← Bills List
            </Link>
          </div>
        }
      />

      <InvoiceView invoice={q.data} />
    </>
  )
}
