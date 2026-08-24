import { useState } from 'react'
import { productApi } from '../../api/productApi'
import { PageHeader } from '../../components/common/Feedback'
import toast from 'react-hot-toast'
import type { ImportPreviewResponse } from '../../types'

export function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const runPreview = async () => {
    if (!file) return
    setBusy(true)
    try {
      setPreview(await productApi.previewImport(file))
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const r = await productApi.confirmImport(preview.batchId)
      toast.success('Import completed')
      setResult(`Created ${r.created}, updated ${r.updated}, inventory rows ${r.inventoryUpdated}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Excel / CSV import"
        actions={
          <button type="button" className="btn btn-outline-secondary" onClick={() => void productApi.downloadTemplate()}>
            Download template
          </button>
        }
      />
      <div className="card-panel">
        <ol>
          <li>Download the template</li>
          <li>Upload the filled file</li>
          <li>Review row errors</li>
          <li>Confirm import</li>
        </ol>
        <input className="form-control" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn btn-gold mt-3" type="button" disabled={!file || busy} onClick={() => void runPreview()}>
          {busy ? 'Working…' : 'Validate & preview'}
        </button>
      </div>
      {preview ? (
        <div className="card-panel">
          <p>Valid {preview.validRowCount} · Errors {preview.errorRowCount}</p>
          <div className="table-responsive">
            <table className="table app-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td>{r.productCode}</td>
                    <td>{r.productName}</td>
                    <td>{r.isValid ? 'OK' : 'Error'}</td>
                    <td>{r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-gold" type="button" disabled={busy || preview.validRowCount === 0} onClick={() => void confirm()}>
            Confirm import
          </button>
        </div>
      ) : null}
      {result ? <div className="alert alert-success">{result}</div> : null}
    </>
  )
}
