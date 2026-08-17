import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function PermissionRoute({ permission, children }) {
  const { user } = useAuthStore()
  if (user?.role === 'superadmin') return children
  if (user?.role === 'admin') {
    if (permission && user?.permissions?.includes(permission)) return children
    if (!permission) return children
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Navigate to="/admin/dashboard" replace />
}