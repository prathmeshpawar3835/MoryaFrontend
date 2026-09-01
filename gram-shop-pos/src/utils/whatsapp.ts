import toast from 'react-hot-toast'
import type { WhatsAppShare } from '../types'

export async function deliverWhatsAppShare(
  share: WhatsAppShare,
  fallbackPdf?: () => Promise<void>,
) {
  if (share.sent && share.documentAttached) {
    toast.success(`PDF sent to customer WhatsApp (${share.invoiceNumber})`)
    return true
  }

  if (!share.shareUrl) {
    toast.error(share.error || 'WhatsApp sending failed. Check the customer mobile number.')
    return false
  }

  window.open(share.shareUrl, '_blank', 'noopener,noreferrer')
  if (!share.documentAttached && fallbackPdf) {
    try {
      await fallbackPdf()
    } catch {
      /* download is optional fallback */
    }
    toast.success('WhatsApp opened and PDF downloaded. Attach the PDF in the chat, or enable WhatsApp Cloud API in Settings to send it automatically.')
  } else if (share.error) {
    toast.error(share.error)
  } else {
    toast.success('WhatsApp opened')
  }
  return true
}
