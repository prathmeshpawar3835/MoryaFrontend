import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <div className="card-panel">
      <h1>Access denied</h1>
      <p>You do not have permission to open this screen.</p>
      <Link to="/dashboard" className="btn btn-gold">
        Back to dashboard
      </Link>
    </div>
  )
}
