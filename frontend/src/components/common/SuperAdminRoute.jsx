import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

export default function SuperAdminRoute({ children }) {
  const { user } = useAuthStore()

  if (user?.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}