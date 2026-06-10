import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle, XCircle } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Table, Pagination, Modal, EmptyState, Badge } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_TABS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed']

export default function AdminReports() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', { page, status }],
    queryFn: () => adminAPI.getReports({
      page, limit: 20,
      ...(status !== 'all' && { status }),
    }).then(r => r.data),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }) => adminAPI.resolveReport(id, { status, note }),
    onSuccess: () => { toast.success('Report updated'); setModal(null); setNote(''); qc.invalidateQueries(['admin-reports']) },
    onError: () => toast.error('Failed'),
  })

  const reports = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Reports Management</h1>
        <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} total reports</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={clsx('px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
              status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200')}>
            {s === 'all' ? 'All Reports' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-4 space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title={status === 'pending' ? 'No pending reports! ✅' : 'No reports found'} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Reporter', 'Type', 'Reason', 'Status', 'Submitted', 'Actions']}>
            {reports.map(report => (
              <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{report.reportedBy?.firstName} {report.reportedBy?.lastName}</p>
                  <p className="text-xs text-gray-500">{report.reportedBy?.email}</p>
                </td>
                <td className="py-3.5 px-4">
                  <span className="badge badge-gray capitalize">{report.refModel}</span>
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200 max-w-xs truncate">{report.reason}</p>
                </td>
                <td className="py-3.5 px-4">
                  <span className={clsx('badge capitalize',
                    report.status === 'resolved' ? 'badge-success' :
                    report.status === 'pending' ? 'badge-warning' :
                    report.status === 'dismissed' ? 'badge-gray' : 'badge-primary')}>
                    {report.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                </td>
                <td className="py-3.5 px-4">
                  {report.status === 'pending' && (
                    <button onClick={() => setModal(report)} className="btn-secondary btn-sm">Review</button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <div className="px-4 pb-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setNote('') }} title="Review Report">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Reported by: {modal?.reportedBy?.firstName} {modal?.reportedBy?.lastName}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Reason:</strong> {modal?.reason}</p>
            {modal?.description && <p className="text-gray-500 mt-1">{modal?.description}</p>}
          </div>
          <div>
            <label className="label">Review Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="input resize-none" placeholder="Add admin note..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => resolveMutation.mutate({ id: modal._id, status: 'dismissed', note })} className="btn-ghost flex-1 text-gray-600">Dismiss</button>
            <button onClick={() => resolveMutation.mutate({ id: modal._id, status: 'resolved', note })} disabled={resolveMutation.isPending} className="btn-primary flex-1">
              {resolveMutation.isPending ? '...' : 'Resolve'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
