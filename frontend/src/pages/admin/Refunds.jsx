import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Avatar, EmptyState, Pagination } from '@/components/common/UI'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const TABS = [
  { key: 'requested',  label: 'Requested' },
  { key: 'processing', label: 'Processing' },
  { key: 'refunded',   label: 'Completed' },
]

export default function AdminRefunds() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('requested')
  const [note, setNote] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-refunds', activeTab],
    queryFn: () => adminAPI.getRefunds({ refundStatus: activeTab }).then(r => r.data),
  })

  const processMutation = useMutation({
    mutationFn: ({ id, status, note }) => adminAPI.processRefund(id, { status, note }),
    onSuccess: (_, { status }) => {
      toast.success(`Refund ${status}!`)
      setSelected(null)
      setNote('')
      qc.invalidateQueries(['admin-refunds'])
    },
    onError: () => toast.error('Failed'),
  })

  const refunds = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Refund Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Process and manage refund requests</p>
      </div>

      <div className="flex gap-2">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
              activeTab === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300')}>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-20 animate-pulse bg-gray-100 dark:bg-dark-800" />
          ))}
        </div>
      ) : refunds.length === 0 ? (
        <EmptyState icon={CheckCircle} title="No refunds found" />
      ) : (
        <div className="space-y-4">
          {refunds.map(inv => (
            <div key={inv._id} className="card p-5">
              <div className="flex items-start gap-4">
                <Avatar name={`${inv.uid?.firstName} ${inv.uid?.lastName}`}
                  src={inv.uid?.avatar?.secureUrl} size="md" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {inv.uid?.firstName} {inv.uid?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{inv.uid?.email}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="font-bold">₹{inv.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reason</p>
                      <p className="text-gray-700 dark:text-gray-200 truncate">{inv.refundReason || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Requested</p>
                      <p>{inv.createdAt ? format(new Date(inv.createdAt), 'MMM dd, yyyy') : '—'}</p>
                    </div>
                  </div>
                </div>
                {activeTab !== 'refunded' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setSelected(inv)}
                      className="btn-primary btn-sm flex items-center gap-1.5">
                      <RefreshCw size={12} /> Process
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Process Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Process Refund</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>{selected.uid?.firstName}</strong> — ₹{selected.amount}
            </p>
            {selected.refundReason && (
              <p className="text-xs text-gray-400 mb-4">Reason: {selected.refundReason}</p>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)}
              rows={3} className="input resize-none mb-4" placeholder="Add a note (optional)..." />
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => processMutation.mutate({ id: selected._id, status: 'processing', note })}
                disabled={processMutation.isPending} className="btn-outline flex-1">
                <Clock size={13} /> Processing
              </button>
              <button onClick={() => processMutation.mutate({ id: selected._id, status: 'refunded', note })}
                disabled={processMutation.isPending} className="btn-primary flex-1">
                <CheckCircle size={13} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}