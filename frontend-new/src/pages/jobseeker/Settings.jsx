import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Lock, Bell, Shield, Eye, EyeOff, Trash2 } from 'lucide-react'
import { authAPI } from '@/services/api'
import { Modal } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function JSSettings() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const passwordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => { toast.success('Password changed!'); reset() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

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

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Lock size={16} className="text-primary-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Change Password</h2>
        </div>
        <form onSubmit={handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input {...register('currentPassword', { required: 'Required' })}
                type={showCurrent ? 'text' : 'password'} className="input pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
                type={showNew ? 'text' : 'password'} className="input pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...register('confirmPassword', { required: 'Required', validate: v => v === watch('newPassword') || 'No match' })}
              type="password" className="input" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

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
