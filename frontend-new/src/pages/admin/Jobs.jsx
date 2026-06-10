import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import { adminAPI, jobsAPI } from '@/services/api'
import { StatusBadge, EmptyState, Pagination, Modal, Table } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected', 'expired']

export default function AdminJobs() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [moderateModal, setModerateModal] = useState(null)
  const [moderateAction, setModerateAction] = useState('')
  const [moderateNote, setModerateNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', { page, status: statusFilter }],
    queryFn: () => adminAPI.getAllJobs({
      page, limit: 15,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }).then(r => r.data),
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, status, note }) => jobsAPI.moderate(id, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(`Job ${vars.status} successfully`)
      setModerateModal(null)
      setModerateNote('')
      qc.invalidateQueries(['admin-jobs'])
      qc.invalidateQueries(['admin-dashboard'])
    },
    onError: () => toast.error('Failed to update job'),
  })

  const jobs = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Job Moderation</h1>
        <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} jobs</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            )}>
            {s === 'all' ? 'All Jobs' : s}
            {s === 'pending' && data?.pagination?.total > 0 && statusFilter !== 'pending' && (
              <span className="ml-1 w-4 h-4 rounded-full bg-amber-500 text-white text-xs inline-flex items-center justify-center">!</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-4 space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="flex-1 h-4 bg-gray-200 dark:bg-dark-700 rounded" />
              <div className="w-20 h-4 bg-gray-200 dark:bg-dark-700 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={CheckCircle} title={statusFilter === 'pending' ? 'No pending jobs! 🎉' : 'No jobs found'}
          description={statusFilter === 'pending' ? 'All job listings have been reviewed.' : 'Try a different filter'} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Job', 'Employer', 'Status', 'Posted', 'Actions']}>
            {jobs.map(job => (
              <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{job.workplaceType} · {job.city || 'Remote'}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      {job.uid?.firstName} {job.uid?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{job.uid?.email}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4"><StatusBadge status={job.status} /></td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    <Link to={`/jobs/${job.slug || job._id}`} target="_blank"
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-primary-600 transition-colors">
                      <Eye size={13} />
                    </Link>
                    {job.status === 'pending' && (
                      <>
                        <button onClick={() => { setModerateModal(job); setModerateAction('approved') }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Approve">
                          <CheckCircle size={13} />
                        </button>
                        <button onClick={() => { setModerateModal(job); setModerateAction('rejected') }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                          title="Reject">
                          <XCircle size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <div className="px-4 pb-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          </div>
        </div>
      )}

      {/* Moderate Modal */}
      <Modal open={!!moderateModal} onClose={() => { setModerateModal(null); setModerateNote('') }}
        title={`${moderateAction === 'approved' ? 'Approve' : 'Reject'} Job`}>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{moderateModal?.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">by {moderateModal?.uid?.firstName} {moderateModal?.uid?.lastName}</p>
          </div>
          <div>
            <label className="label">{moderateAction === 'rejected' ? 'Rejection Reason *' : 'Note (Optional)'}</label>
            <textarea value={moderateNote} onChange={e => setModerateNote(e.target.value)}
              rows={3} placeholder={moderateAction === 'rejected' ? 'Explain why this job is being rejected...' : 'Add a note for the employer...'}
              className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModerateModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                if (moderateAction === 'rejected' && !moderateNote.trim()) { toast.error('Please provide a rejection reason'); return }
                moderateMutation.mutate({ id: moderateModal._id, status: moderateAction, note: moderateNote })
              }}
              disabled={moderateMutation.isPending}
              className={moderateAction === 'approved' ? 'btn-primary flex-1' : 'btn-danger flex-1'}>
              {moderateMutation.isPending ? 'Processing...' : moderateAction === 'approved' ? 'Approve Job' : 'Reject Job'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
