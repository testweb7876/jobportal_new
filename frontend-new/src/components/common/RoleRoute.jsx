import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function RoleRoute({ role, children }) {
  const { user } = useAuthStore()
  const allowed = ['admin', 'superadmin'].includes(user?.role) || user?.role === role
  if (!allowed) return <Navigate to="/dashboard" replace />
  return children
}
