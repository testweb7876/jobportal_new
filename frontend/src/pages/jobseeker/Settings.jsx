import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/common/UI'
import AccountSecuritySection from '@/components/common/AccountSecuritySection'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

export default function JSSettings() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { default: api } = await import('@/services/api')
      return api.delete('/users/account')
    },
    onSuccess: async () => { await logout(); navigate('/'); toast.success('Account deleted') },
    onError: () => toast.error('Failed to delete account'),
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="page-title">Settings</h1>

      <AccountSecuritySection />

      <div className="card p-6 border-2 border-red-100 dark:border-red-900/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <h2 className="font-display font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <button onClick={() => setDeleteModal(true)} className="btn-danger btn-sm">Delete Account</button>
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">Are you sure? This is <strong>irreversible</strong>.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-danger flex-1">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}