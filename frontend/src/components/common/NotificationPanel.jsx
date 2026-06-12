// src/components/common/NotificationPanel.jsx
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { notificationAPI } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_COLORS = {
  application_submitted:   'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  application_status:      'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  job_alert:               'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  payment_success:         'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  payment_failed:          'bg-red-100 dark:bg-red-900/30 text-red-600',
  package_expiry_warning:  'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  job_approved:            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  job_rejected:            'bg-red-100 dark:bg-red-900/30 text-red-600',
  new_message:             'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
  default:                 'bg-gray-100 dark:bg-dark-700 text-gray-500',
}

function NotifIcon({ type }) {
  const cls = TYPE_COLORS[type] || TYPE_COLORS.default
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${cls}`}>
      <Bell size={13} />
    </div>
  )
}

export default function NotificationPanel({ isAuthenticated }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const qc = useQueryClient()

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationAPI.unreadCount().then(r => r.data?.count || 0),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifs-panel'],
    queryFn: () => notificationAPI.getAll({ limit: 20 }).then(r => r.data?.data || []),
    enabled: isAuthenticated && open,
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationAPI.markRead(id),
    onSuccess: () => { qc.invalidateQueries(['notifs-panel']); qc.invalidateQueries(['notif-count']) },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => { qc.invalidateQueries(['notifs-panel']); qc.invalidateQueries(['notif-count']) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries(['notifs-panel']); qc.invalidateQueries(['notif-count']) },
  })

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-0.5 ring-2 ring-white dark:ring-dark-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 card shadow-xl overflow-hidden z-50">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="badge badge-primary text-xs">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title="Mark all read">
                    <CheckCheck size={12} /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-700 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <div key={n._id}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-dark-700/50 last:border-0 transition-colors',
                      !n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-dark-700/40'
                    )}>
                    <NotifIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-xs leading-relaxed', !n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200')}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(n._id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Mark as read">
                          <Check size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(n._id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}