import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <div className="card-panel text-center py-5">
      <div className="mb-3">
        <i className="bi bi-shield-slash text-danger" style={{ fontSize: '3.5rem' }} />
      </div>
      <h1 className="h3 fw-bold text-navy-900 mb-2">Access Restricted</h1>
      <p className="text-muted mb-4 max-w-md mx-auto">
        Your current role does not have the required permissions to view or perform actions on this screen.
        Please contact your store administrator if you believe this is an error.
      </p>
      <Link to="/dashboard" className="btn btn-gold px-4 py-2">
        <i className="bi bi-speedometer2 me-2" /> Back to Dashboard
      </Link>
    </div>
  )
}
