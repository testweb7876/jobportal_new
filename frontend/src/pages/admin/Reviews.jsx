import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, XCircle, Building2, Eye } from 'lucide-react'
import { reviewAPI } from '@/services/api'
import { Table, Pagination, Modal, EmptyState, Avatar } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected']

export default function AdminReviews() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { review, action: 'approved' | 'rejected' }
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { page, status, search }],
    queryFn: () => reviewAPI.getAllAdmin({
      page,
      limit: 20,
      ...(status !== 'all' && { status }),
      ...(search && { search }),
    }).then(r => r.data),
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, status, note }) => reviewAPI.moderate(id, { status, note }),
    onSuccess: () => {
      toast.success('Review moderated')
      setModal(null)
      setNote('')
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to moderate review'),
  })

  const reviews = data?.data || []
  const pagination = data?.pagination || {}

  const statusBadge = (s) => clsx('badge capitalize',
    s === 'approved' ? 'badge-success' :
    s === 'pending'  ? 'badge-warning' :
    'badge-gray')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title mb-1">Reviews Moderation</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} review{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search title or review text..."
          className="input max-w-xs" />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
              status === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            )}>
            {s === 'all' ? 'All Reviews' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-4 space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title={status === 'pending' ? 'No pending reviews! ✅' : 'No reviews found'} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Company', 'Reviewer', 'Rating', 'Title / Review', 'Status', 'Submitted', 'Actions']}>
            {reviews.map(r => (
              <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {r.companyId?.logo?.secureUrl
                        ? <img src={r.companyId.logo.secureUrl} alt={r.companyId.name} className="w-full h-full object-cover" />
                        : <Building2 size={14} className="text-gray-400" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.companyId?.name || 'Unknown company'}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${r.uid?.firstName} ${r.uid?.lastName}`} src={r.uid?.avatar?.secureUrl} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {r.uid?.firstName || ''} {r.uid?.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500">{r.uid?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? 'text-amber-500 fill-current' : 'text-gray-300'} />
                    ))}
                  </div>
                </td>
                <td
                  className="py-3.5 px-4 max-w-xs cursor-pointer"
                  onClick={() => setModal({ review: r, action: 'view' })}>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-primary-600 transition-colors">{r.title}</p>
                  <p className="text-xs text-gray-500 truncate">{r.review}</p>
                </td>
                <td className="py-3.5 px-4">
                  <span className={statusBadge(r.status)}>{r.status}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModal({ review: r, action: 'view' })}
                      title="View full review"
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <Eye size={14} />
                    </button>
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setModal({ review: r, action: 'approved' })}
                          title="Approve"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors">
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => setModal({ review: r, action: 'rejected' })}
                          title="Reject"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                          <XCircle size={14} />
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

      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setNote('') }}
        title={
          modal?.action === 'approved' ? 'Approve Review' :
          modal?.action === 'rejected' ? 'Reject Review' :
          'Review Details'
        }>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">
                Company: <strong className="text-gray-700 dark:text-gray-200">{modal?.review?.companyId?.name}</strong>
              </p>
              <span className={statusBadge(modal?.review?.status)}>{modal?.review?.status}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              Reviewer: <strong className="text-gray-700 dark:text-gray-200">
                {modal?.review?.uid?.firstName || ''} {modal?.review?.uid?.lastName || ''}
              </strong>
              {modal?.review?.uid?.email && (
                <span className="text-gray-400">({modal.review.uid.email})</span>
              )}
            </p>
            <div className="flex items-center gap-1 mb-2">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={14} className={i < (modal?.review?.rating || 0) ? 'text-amber-500 fill-current' : 'text-gray-300'} />
              ))}
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{modal?.review?.title}</p>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{modal?.review?.review}</p>
            {modal?.review?.pros && (
              <p className="text-emerald-600 mt-3"><strong>Pros:</strong> {modal.review.pros}</p>
            )}
            {modal?.review?.cons && (
              <p className="text-red-500 mt-1"><strong>Cons:</strong> {modal.review.cons}</p>
            )}
            {modal?.review?.moderationNote && (
              <p className="text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                <strong>Moderation note:</strong> {modal.review.moderationNote}
              </p>
            )}
            {modal?.review?.employerResponse?.text && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                <p className="text-xs font-semibold text-gray-500 mb-1">Employer response</p>
                <p className="text-gray-700 dark:text-gray-300">{modal.review.employerResponse.text}</p>
              </div>
            )}
          </div>

          {modal?.action === 'view' ? (
            <div className="flex gap-3">
              {modal?.review?.status === 'pending' && (
                <>
                  <button
                    onClick={() => setModal({ review: modal.review, action: 'rejected' })}
                    className="btn-danger flex-1">
                    Reject
                  </button>
                  <button
                    onClick={() => setModal({ review: modal.review, action: 'approved' })}
                    className="btn-primary flex-1">
                    Approve
                  </button>
                </>
              )}
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Moderation Note (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Add a note for the reviewer..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal({ review: modal.review, action: 'view' })} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  onClick={() => moderateMutation.mutate({ id: modal.review._id, status: modal.action, note })}
                  disabled={moderateMutation.isPending}
                  className={clsx('flex-1', modal?.action === 'approved' ? 'btn-primary' : 'btn-danger')}>
                  {moderateMutation.isPending ? 'Saving...' : modal?.action === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}