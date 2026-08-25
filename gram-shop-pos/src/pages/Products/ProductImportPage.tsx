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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to parse Excel file')
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const r = await productApi.confirmImport(preview.batchId)
      toast.success('Import completed successfully')
      setResult(`Created ${r.created} new products, updated ${r.updated} existing items, and recorded ${r.inventoryUpdated} inventory rows.`)
      setPreview(null)
      setFile(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to complete import')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Excel / CSV Bulk Product Import"
        subtitle="Upload spreadsheet batches to quickly create or update multiple jewellery products"
        actions={
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => void productApi.downloadTemplate()}
          >
            <i className="bi bi-download me-1" /> Download Excel Template
          </button>
        }
      />

      <div className="card-panel">
        <h2 className="h5 fw-bold mb-3"><i className="bi bi-file-earmark-spreadsheet text-success" /> Upload Instructions</h2>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3 h-100 border">
              <div className="fw-bold text-navy-900 mb-1">1. Download Template</div>
              <small className="text-muted">Use the standard pre-formatted Excel template with required columns.</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3 h-100 border">
              <div className="fw-bold text-navy-900 mb-1">2. Fill Products</div>
              <small className="text-muted">Enter product code, name, category, prices, and GST rates.</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3 h-100 border">
              <div className="fw-bold text-navy-900 mb-1">3. Validate File</div>
              <small className="text-muted">Upload and click Preview to detect any row validation errors.</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded-3 h-100 border">
              <div className="fw-bold text-navy-900 mb-1">4. Confirm Import</div>
              <small className="text-muted">Batch commit changes into the live database catalog.</small>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Select .xlsx, .xls or .csv Spreadsheet File</label>
          <input
            className="form-control"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          className="btn btn-gold px-4"
          type="button"
          disabled={!file || busy}
          onClick={() => void runPreview()}
        >
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Parsing Spreadsheet…
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-check me-1" /> Validate & Preview Batch
            </>
          )}
        </button>
      </div>

      {preview ? (
        <div className="card-panel">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0"><i className="bi bi-table text-primary" /> Import Preview Results</h2>
            <div className="d-flex gap-2">
              <span className="badge bg-success-subtle text-success border border-success-subtle py-2 px-3">
                <i className="bi bi-check-circle me-1" /> Valid Rows: {preview.validRowCount}
              </span>
              <span className={`badge ${preview.errorRowCount > 0 ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-light text-muted border'} py-2 px-3`}>
                <i className="bi bi-exclamation-circle me-1" /> Error Rows: {preview.errorRowCount}
              </span>
            </div>
          </div>

          <div className="table-responsive mb-3">
            <table className="table app-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Validation Status</th>
                  <th>Error Diagnostics</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber} className={!r.isValid ? 'table-danger' : ''}>
                    <td className="fw-bold">{r.rowNumber}</td>
                    <td>{r.productCode}</td>
                    <td>{r.productName}</td>
                    <td>
                      <span className={`badge ${r.isValid ? 'bg-success' : 'bg-danger'}`}>
                        {r.isValid ? 'Ready' : 'Invalid'}
                      </span>
                    </td>
                    <td className="small text-danger fw-medium">{r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end">
            <button
              className="btn btn-gold px-4 py-2 fw-bold"
              type="button"
              disabled={busy || preview.validRowCount === 0}
              onClick={() => void confirm()}
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Committing Records…
                </>
              ) : (
                <>
                  <i className="bi bi-check2-all me-1" /> Confirm & Import {preview.validRowCount} Valid Products
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="alert alert-success d-flex align-items-center gap-2 p-3 mt-3">
          <i className="bi bi-check-circle-fill fs-4" />
          <div>{result}</div>
        </div>
      ) : null}
    </>
  )
}
