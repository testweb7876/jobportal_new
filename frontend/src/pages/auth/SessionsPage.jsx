import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Smartphone, Globe, LogOut, Shield, Clock } from 'lucide-react'
import { authAPI } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

function DeviceIcon({ userAgent = '' }) {
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'))
    return <Smartphone size={18} className="text-primary-600" />
  return <Monitor size={18} className="text-primary-600" />
}

export default function SessionsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authAPI.getSessions().then(r => r.data?.sessions || []),
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => authAPI.revokeSession(id),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries({ queryKey: ['sessions'] }) },
    onError: () => toast.error('Failed to revoke session'),
  })

  const sessions = data || []

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title mb-1">Active Sessions</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage all devices where you're currently logged in
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
        <Shield size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          If you see a session you don't recognise, revoke it immediately and change your password.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <Monitor size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No active sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div key={session._id} className={clsx(
              'card p-5 flex items-start gap-4',
              i === 0 && 'ring-2 ring-primary-200 dark:ring-primary-800'
            )}>
              <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <DeviceIcon userAgent={session.userAgent} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {session.deviceName || 'Unknown Device'}
                  </p>
                  {i === 0 && (
                    <span className="badge badge-success text-xs">Most Recent</span>
                  )}
                </div>

                <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {session.ip && (
                    <p className="flex items-center gap-1.5">
                      <Globe size={11} /> IP: {session.ip}
                    </p>
                  )}
                  {session.userAgent && (
                    <p className="truncate max-w-xs">{session.userAgent}</p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock size={11} />
                    {session.createdAt
                      ? `Signed in ${formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}`
                      : 'Active session'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => revokeMutation.mutate(session._id)}
                disabled={revokeMutation.isPending}
                className="flex items-center gap-1.5 btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0">
                <LogOut size={13} /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}