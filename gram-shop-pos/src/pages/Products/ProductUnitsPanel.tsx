import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productUnitApi } from '../../api/productUnitApi'
import { queryKeys } from '../../api/queryKeys'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { canAccess } from '../../constants/permissions'
import { toastApiError } from '../../utils/errors'
import { formatMoney } from '../../utils/format'
import { JewelleryTagPrint, saveTagSize, tagSize } from '../../components/print/JewelleryTagPrint'
import { downloadQrPng, qrDataUrl } from '../../utils/qr'
import type { ProductUnit } from '../../types'

export function ProductUnitsPanel({ productId }: { productId: number }) {
  const { selectedStoreId } = useStore()
  const { user } = useAuth()
  const canWrite = canAccess(user?.role, 'products.write')
  const [selected, setSelected] = useState<number[]>([])
  const [size, setSize] = useState(tagSize)
  const [printUnits, setPrintUnits] = useState<ProductUnit[] | null>(null)
  const [preview, setPreview] = useState<{ id: number; qr: string; barcode: string } | null>(null)

  const query = { pageNumber: 1, pageSize: 200, productId, storeId: selectedStoreId ?? undefined }
  const q = useQuery({
    queryKey: queryKeys.productUnits(query),
    queryFn: () => productUnitApi.list(query),
  })

  const units = q.data?.items ?? []
  const allIds = useMemo(() => units.map((u) => u.id), [units])
  const chosen = selected.length ? selected : allIds
  const colSpan = canWrite ? 7 : 6

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const showPreview = async (unit: ProductUnit) => {
    try {
      const qr = await qrDataUrl(unit.uniqueNumber, 176)
      let barcode = ''
      try {
        barcode = URL.createObjectURL(await productUnitApi.barcodeBlob(unit.id))
      } catch {
        barcode = ''
      }
      setPreview({ id: unit.id, qr, barcode })
    } catch (err: unknown) {
      toastApiError(err, 'Could not generate QR code')
    }
  }

  return (
    <div className="card-panel mt-3">
      <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-qr-code text-gold" /> Piece Unique Numbers
          </h2>
          <p className="text-muted small mb-0">
            Each tagged piece can have its own MRP and selling price. New stock starts at this product&apos;s price; change any
            piece below so ten rings (or any category) can sell at ten different rates.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <label className="small text-muted d-flex align-items-center gap-1 mb-0">
            Tag W mm
            <input
              className="form-control form-control-sm"
              style={{ width: 72 }}
              type="number"
              min={20}
              max={120}
              value={size.widthMm}
              onChange={(e) => {
                const next = { ...size, widthMm: Number(e.target.value) }
                setSize(next)
                saveTagSize(next.widthMm, next.heightMm)
              }}
            />
          </label>
          <label className="small text-muted d-flex align-items-center gap-1 mb-0">
            Tag H mm
            <input
              className="form-control form-control-sm"
              style={{ width: 72 }}
              type="number"
              min={15}
              max={80}
              value={size.heightMm}
              onChange={(e) => {
                const next = { ...size, heightMm: Number(e.target.value) }
                setSize(next)
                saveTagSize(next.widthMm, next.heightMm)
              }}
            />
          </label>
          <button
            className="btn btn-sm btn-outline-secondary"
            type="button"
            disabled={!chosen.length}
            onClick={() =>
              productUnitApi.downloadZip({ ids: [...new Set(chosen)], productId }).catch((err) => toastApiError(err, 'ZIP download failed'))
            }
          >
            <i className="bi bi-download me-1" /> Download QRs
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            type="button"
            disabled={!chosen.length}
            onClick={() =>
              productUnitApi
                .downloadTagsPdf({ ids: chosen, productId, widthMm: size.widthMm, heightMm: size.heightMm })
                .catch((err) => toastApiError(err, 'Tag PDF download failed'))
            }
          >
            <i className="bi bi-file-earmark-pdf me-1" /> Tags PDF
          </button>
          <button
            className="btn btn-sm btn-gold"
            type="button"
            disabled={!chosen.length}
            onClick={() => {
              const rows = units.filter((u) => chosen.includes(u.id))
              if (!rows.length) {
                toast.error('Select at least one piece')
                return
              }
              setPrintUnits(rows)
            }}
          >
            <i className="bi bi-printer me-1" /> Print Tags
          </button>
        </div>
      </div>

      <div className="table-shell">
        <table className="table app-table align-middle mb-0">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={units.length > 0 && selected.length === units.length}
                  onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                />
              </th>
              <th>Unique Number</th>
              <th>Status</th>
              <th>MRP</th>
              <th>Selling</th>
              {canWrite ? <th>Purchase</th> : null}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-muted text-center py-4">
                  No tagged pieces yet. Create or import stock as whole pieces (PCS) to generate unique numbers. After that,
                  set a different selling price on each piece if needed.
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(unit.id)} onChange={() => toggle(unit.id)} />
                  </td>
                  <td>
                    <span className="fw-bold font-monospace">{unit.uniqueNumber}</span>
                  </td>
                  <td>
                    <span className={`badge ${unit.status === 1 || unit.status === 3 || unit.status === 4 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                      {unit.statusName}
                    </span>
                  </td>
                  {canWrite ? (
                    <PiecePriceCells unit={unit} listQuery={query} />
                  ) : (
                    <>
                      <td>{formatMoney(unit.mrp)}</td>
                      <td>{formatMoney(unit.sellingPrice)}</td>
                    </>
                  )}
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => void showPreview(unit)}>
                        QR
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        onClick={() =>
                          downloadQrPng(unit.uniqueNumber, `${unit.uniqueNumber}.png`).catch((err) =>
                            toastApiError(err, 'Could not generate QR code'),
                          )
                        }
                      >
                        Download
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setPrintUnits([unit])}>
                        Print tag
                      </button>
                    </div>
                    {preview?.id === unit.id ? (
                      <div className="d-flex gap-3 mt-2 align-items-center">
                        <img src={preview.qr} alt="QR" style={{ width: 88, height: 88, background: '#fff' }} />
                        {preview.barcode ? (
                          <img src={preview.barcode} alt="Code128" style={{ height: 48, background: '#fff' }} />
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printUnits ? (
        <JewelleryTagPrint
          units={printUnits}
          widthMm={size.widthMm}
          heightMm={size.heightMm}
          onClose={() => setPrintUnits(null)}
        />
      ) : null}
    </div>
  )
}

function PiecePriceCells({ unit, listQuery }: { unit: ProductUnit; listQuery: object }) {
  const qc = useQueryClient()
  const [mrp, setMrp] = useState(String(unit.mrp))
  const [selling, setSelling] = useState(String(unit.sellingPrice))
  const [purchase, setPurchase] = useState(String(unit.purchasePrice ?? 0))

  useEffect(() => {
    setMrp(String(unit.mrp))
    setSelling(String(unit.sellingPrice))
    setPurchase(String(unit.purchasePrice ?? 0))
  }, [unit.id, unit.mrp, unit.sellingPrice, unit.purchasePrice])

  const dirty =
    Number(mrp) !== unit.mrp || Number(selling) !== unit.sellingPrice || Number(purchase) !== (unit.purchasePrice ?? 0)

  const save = useMutation({
    mutationFn: () =>
      productUnitApi.update(unit.id, {
        mrp: Number(mrp),
        sellingPrice: Number(selling),
        purchasePrice: Number(purchase),
      }),
    onSuccess: async () => {
      toast.success(`${unit.uniqueNumber} price saved`)
      await qc.invalidateQueries({ queryKey: queryKeys.productUnits(listQuery) })
    },
    onError: (err: unknown) => toastApiError(err, 'Could not save piece price'),
  })

  return (
    <>
      <td>
        <input
          className="form-control form-control-sm"
          style={{ width: 110 }}
          type="number"
          min={0}
          step="any"
          value={mrp}
          onChange={(e) => setMrp(e.target.value)}
        />
      </td>
      <td>
        <div className="d-flex align-items-center gap-1">
          <input
            className="form-control form-control-sm"
            style={{ width: 110 }}
            type="number"
            min={0}
            step="any"
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
          />
          <button
            className="btn btn-sm btn-gold"
            type="button"
            disabled={!dirty || save.isPending || Number.isNaN(Number(mrp)) || Number.isNaN(Number(selling))}
            onClick={() => save.mutate()}
          >
            Save
          </button>
        </div>
      </td>
      <td>
        <input
          className="form-control form-control-sm"
          style={{ width: 110 }}
          type="number"
          min={0}
          step="any"
          value={purchase}
          onChange={(e) => setPurchase(e.target.value)}
        />
      </td>
    </>
  )
}
