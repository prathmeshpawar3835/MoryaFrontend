import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, type FeatureKey } from '../constants/permissions'
import { PageLoader } from '../components/common/Feedback'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RoleProtectedRoute({ feature }: { feature: FeatureKey }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!canAccess(user.role, feature)) return <Navigate to="/access-denied" replace />
  return <Outlet />
}
