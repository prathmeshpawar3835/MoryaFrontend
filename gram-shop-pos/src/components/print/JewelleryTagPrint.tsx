import { useEffect, useMemo, useState } from 'react'
import { productUnitApi } from '../../api/productUnitApi'
import type { ProductUnit } from '../../types'
import { formatMoney } from '../../utils/format'
import { qrDataUrl } from '../../utils/qr'

const STORAGE_KEY = 'gramshop.tagSize'

export function tagSize() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as { widthMm: number; heightMm: number }
  } catch {
    /* keep defaults */
  }
  return { widthMm: 50, heightMm: 30 }
}

export function saveTagSize(widthMm: number, heightMm: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widthMm, heightMm }))
}

export function JewelleryTagPrint({
  units,
  widthMm,
  heightMm,
  onClose,
}: {
  units: ProductUnit[]
  widthMm: number
  heightMm: number
  onClose: () => void
}) {
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({})
  const [barcodeUrls, setBarcodeUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    void (async () => {
      const qrs: Record<number, string> = {}
      const bars: Record<number, string> = {}
      for (const unit of units) {
        qrs[unit.id] = await qrDataUrl(unit.uniqueNumber, 192)
        try {
          const bar = await productUnitApi.barcodeBlob(unit.id)
          const barUrl = URL.createObjectURL(bar)
          created.push(barUrl)
          bars[unit.id] = barUrl
        } catch {
          /* barcode is optional on the printed tag */
        }
      }
      if (!cancelled) {
        setQrUrls(qrs)
        setBarcodeUrls(bars)
      } else {
        created.forEach((u) => URL.revokeObjectURL(u))
      }
    })()
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [units])

  const ready = useMemo(
    () => units.every((u) => Boolean(qrUrls[u.id])),
    [units, qrUrls],
  )

  return (
    <div className="jewellery-tag-print-overlay">
      <div className="jewellery-tag-print-toolbar no-print">
        <span className="fw-semibold">Zebra jewellery tags · {widthMm}mm × {heightMm}mm</span>
        <div className="d-flex gap-2">
          <button className="btn btn-gold" type="button" disabled={!ready} onClick={() => window.print()}>
            <i className="bi bi-printer me-1" /> Print
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="jewellery-tag-sheet">
        {units.map((unit) => (
          <article
            key={unit.id}
            className="jewellery-tag"
            style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}
          >
            <img className="jewellery-tag-qr" src={qrUrls[unit.id]} alt={unit.uniqueNumber} />
            <div className="jewellery-tag-copy">
              <strong>{unit.uniqueNumber}</strong>
              <span>Category: {unit.categoryName.toUpperCase()}</span>
              <span>MRP: {formatMoney(unit.mrp)}</span>
              <span>Selling Price: {formatMoney(unit.sellingPrice)}</span>
              {barcodeUrls[unit.id] ? <img className="jewellery-tag-barcode" src={barcodeUrls[unit.id]} alt="" /> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
