import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function RoleRoute({ role, children }) {
  const { user } = useAuthStore()

  if (role === 'admin') {
    if (!['admin', 'superadmin'].includes(user?.role)) {
      return <Navigate to="/dashboard" replace />
    }
    return children
  }

  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}