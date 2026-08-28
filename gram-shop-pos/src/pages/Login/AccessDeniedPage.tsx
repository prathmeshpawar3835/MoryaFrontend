import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <div className="card-panel text-center py-5" style={{ maxWidth: 560, margin: '3rem auto' }}>
      <div className="kpi-icon mx-auto mb-3" style={{ width: 64, height: 64, fontSize: '1.6rem' }}>
        <i className="bi bi-shield-slash" />
      </div>
      <h1 className="h3 text-navy-900 mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>Access restricted</h1>
      <p className="text-muted mb-4">
        Your current role cannot open this screen. Ask an administrator if you need access.
      </p>
      <Link to="/dashboard" className="btn btn-gold px-4 py-2">
        <i className="bi bi-grid-1x2 me-2" /> Back to dashboard
      </Link>
    </div>
  )
}
