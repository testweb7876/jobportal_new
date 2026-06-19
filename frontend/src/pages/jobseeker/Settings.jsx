import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Bell, Shield, Eye, EyeOff, Trash2, Monitor, Smartphone, Globe, Clock, LogOut  } from 'lucide-react'
import { authAPI } from '@/services/api'
import { Modal } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'

export default function JSSettings() {
  const { user, logout, logoutAll } = useAuthStore()
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe().then(r => r.data?.user),
  })
  const navigate = useNavigate()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [logoutAllModal, setLogoutAllModal] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()

  const passwordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => { toast.success('Password changed!'); reset() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const qc = useQueryClient()

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authAPI.getSessions().then(r => r.data?.sessions || []),
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => authAPI.revokeSession(id),
    // TanStack Query v5 requires the object form — bare array shorthand
    // silently fails to invalidate, leaving the stale session in the list.
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries({ queryKey: ['sessions'] }) },
    onError: () => toast.error('Failed to revoke session'),
  })

  const resendMutation = useMutation({
    mutationFn: () => authAPI.resendVerification({ email: user?.email }),
    onSuccess: () => toast.success('Verification email sent!'),
    onError: () => toast.error('Failed to send email'),
  })

  const logoutAllMutation = useMutation({
    mutationFn: () => logoutAll(),
    onSuccess: () => { toast.success('Logged out from all devices'); navigate('/login') },
    onError: () => toast.error('Failed to log out everywhere'),
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
              <input {...register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                  message: 'Need uppercase, lowercase, number & special char'
                }
              })}
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

        {/* Email Verification */}
        {!currentUser?.isEmailVerified && (
          <div className="card p-6 border-2 border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Shield size={16} className="text-amber-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900 dark:text-white">Email Verification</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your email is not verified. Verify to unlock all features.
            </p>
            <button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="btn-warning btn-sm">
              {resendMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {/* Active Sessions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Monitor size={16} className="text-primary-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900 dark:text-white">Active Sessions</h2>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={() => setLogoutAllModal(true)}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                <LogOut size={12} /> Logout all devices
              </button>
            )}
          </div>

          {sessionsLoading ? (
            <div className="space-y-3">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-dark-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <div key={session._id} className={clsx(
                  'flex items-start gap-3 p-4 rounded-xl border',
                  i === 0
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/10'
                    : 'border-gray-100 dark:border-dark-700'
                )}>
                  <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    {(session.userAgent || '').toLowerCase().includes('mobile')
                      ? <Smartphone size={15} className="text-primary-600" />
                      : <Monitor size={15} className="text-primary-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session.deviceName || 'Unknown Device'}
                      </p>
                      {/* Backend can't reliably identify which session is the one
                          you're using right now — this just reflects the most
                          recently created session, sorted newest-first. */}
                      {i === 0 && <span className="badge badge-success text-xs">Most Recent</span>}
                    </div>
                    <div className="space-y-0.5 text-xs text-gray-400">
                      {session.ip && (
                        <p className="flex items-center gap-1"><Globe size={10} /> {session.ip}</p>
                      )}
                      {session.createdAt && (
                        <p className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(session._id)}
                    disabled={revokeMutation.isPending}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 flex-shrink-0">
                    <LogOut size={12} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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

      <Modal open={logoutAllModal} onClose={() => setLogoutAllModal(false)} title="Logout from all devices">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            This will sign you out everywhere, including this device. You'll need to log in again.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setLogoutAllModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => logoutAllMutation.mutate()}
              disabled={logoutAllMutation.isPending}
              className="btn-danger flex-1">
              {logoutAllMutation.isPending ? 'Logging out...' : 'Logout Everywhere'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}