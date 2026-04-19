import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {getAdminToken} from '../authStore'

export default function ProtectedRoute() {
  const location = useLocation()
  const token = getAdminToken()

  if (!token) {
    return <Navigate to="/login" replace state={{from: location.pathname}} />
  }

  return <Outlet />
}
