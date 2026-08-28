import QRCode from 'qrcode'

const OPTIONS = {
  margin: 1,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#111111', light: '#ffffff' },
}

export async function qrDataUrl(text: string, width = 256) {
  const payload = text.trim()
  if (!payload) throw new Error('Unique number is required to generate a QR code.')
  return QRCode.toDataURL(payload, { ...OPTIONS, width })
}

export async function downloadQrPng(text: string, fileName: string) {
  const url = await qrDataUrl(text, 512)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
