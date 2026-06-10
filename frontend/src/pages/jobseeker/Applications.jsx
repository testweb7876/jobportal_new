import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Briefcase, Clock, Eye, X, ChevronDown } from 'lucide-react'
import { applicationAPI } from '@/services/api'
import { StatusBadge, EmptyState, Pagination, Modal } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_FILTERS = ['all', 'applied', 'reviewed', 'shortlisted', 'interview_scheduled', 'hired', 'rejected', 'withdrawn']

export default function JSApplications() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [withdrawModal, setWithdrawModal] = useState(null)
  const [reason, setReason] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', { page, status: statusFilter }],
    queryFn: () => applicationAPI.myApplications({
      page,
      limit: 10,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }).then(r => r.data),
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason }) => applicationAPI.withdraw(id, { reason }),
    onSuccess: () => {
      toast.success('Application withdrawn')
      setWithdrawModal(null)
      qc.invalidateQueries(['my-applications'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to withdraw'),
  })

  const applications = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">My Applications</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} total applications</p>
        </div>
        <Link to="/jobs" className="btn-primary btn-sm">Apply to More Jobs</Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            )}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState icon={Briefcase} title="No applications found"
          description={statusFilter === 'all' ? "You haven't applied to any jobs yet." : `No applications with status "${statusFilter}"`}
          action={<Link to="/jobs" className="btn-primary">Browse Jobs</Link>} />
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-dark-600 overflow-hidden">
                  <Briefcase size={20} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {app.jobId?.title || 'Job Position'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {app.jobId?.company} {app.jobId?.city && `· ${app.jobId.city}`}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                    </span>
                    {app.interviewDate && (
                      <span className="text-purple-600 font-medium">
                        📅 Interview: {new Date(app.interviewDate).toLocaleDateString()}
                      </span>
                    )}
                    {app.employerNotes && (
                      <span className="text-gray-500 italic">"{app.employerNotes}"</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              {app.statusHistory?.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {app.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary-600" />
                          <span className="text-xs text-gray-400 whitespace-nowrap mt-1 capitalize">{h.status.replace('_', ' ')}</span>
                        </div>
                        {i < app.statusHistory.length - 1 && <div className="h-px w-8 bg-gray-200 dark:bg-dark-600 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                {app.jobId && (
                  <Link to={`/jobs/${app.jobId.slug || app.jobId._id}`}
                    className="btn-secondary btn-sm flex items-center gap-1.5">
                    <Eye size={13} /> View Job
                  </Link>
                )}
                {!['hired', 'rejected', 'withdrawn'].includes(app.status) && (
                  <button onClick={() => setWithdrawModal(app)}
                    className="btn-ghost btn-sm text-red-500 hover:text-red-600 flex items-center gap-1.5">
                    <X size={13} /> Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}

          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        </div>
      )}

      {/* Withdraw Modal */}
      <Modal open={!!withdrawModal} onClose={() => setWithdrawModal(null)} title="Withdraw Application">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to withdraw your application for <strong>{withdrawModal?.jobId?.title}</strong>?
          </p>
          <div>
            <label className="label">Reason (Optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={3} placeholder="Tell us why you're withdrawing..."
              className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setWithdrawModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => withdrawMutation.mutate({ id: withdrawModal._id, reason })}
              disabled={withdrawMutation.isPending}
              className="btn-danger flex-1">
              {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
