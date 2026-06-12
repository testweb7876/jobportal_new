import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, CheckCircle, ExternalLink, RefreshCw, XCircle, Clock } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Avatar, Badge, EmptyState } from '@/components/common/UI'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/services/api'

const TABS = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'paid',     label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function BankTransfers() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending')
  const [loadingId, setLoadingId] = useState(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bank-transfers'],
    queryFn: async () => {
        const res = await adminAPI.getBankTransfers()
        return res.data?.data?.invoices || res.data?.invoices || []
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      if (status === 'paid') return adminAPI.approveBankTransfer(id)
      return api.patch(`/payments/bank/${id}/status`, { status })
    },
    onMutate: ({ id }) => setLoadingId(id),
    onSuccess: (_, { status }) => {
      const msg = status === 'paid' ? 'Transfer approved & package activated! ✅'
                : status === 'rejected' ? 'Transfer rejected ❌'
                : 'Transfer marked as pending 🕐'
      toast.success(msg)
      qc.invalidateQueries(['bank-transfers'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Action failed'),
    onSettled: () => setLoadingId(null),
  })

  const allTransfers = data || []

  const filtered = activeTab === 'all'
    ? allTransfers
    : allTransfers.filter(t => {
        if (activeTab === 'paid')     return t.paymentStatus === 'paid'
        if (activeTab === 'rejected') return t.paymentStatus === 'rejected' || t.paymentStatus === 'failed'
        return t.paymentStatus === 'pending'
      })

  const counts = {
    all:      allTransfers.length,
    pending:  allTransfers.filter(t => t.paymentStatus === 'pending').length,
    paid:     allTransfers.filter(t => t.paymentStatus === 'paid').length,
    rejected: allTransfers.filter(t => ['rejected','failed'].includes(t.paymentStatus)).length,
  }

  const statusBadge = (status) => {
    if (status === 'paid')     return <Badge variant="success">Approved</Badge>
    if (status === 'rejected' || status === 'failed') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Bank Transfers</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage bank transfer proofs
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-outline btn-sm">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-800 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
              ${activeTab === tab.key
                ? 'bg-white dark:bg-dark-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === tab.key
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'bg-gray-200 dark:bg-dark-600 text-gray-500'
              }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title={`No ${activeTab === 'all' ? '' : activeTab} transfers`}
          description="Nothing to show here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(inv => {
            const isThis = loadingId === inv._id
            const isPending  = inv.paymentStatus === 'pending'
            const isApproved = inv.paymentStatus === 'paid'
            const isRejected = ['rejected','failed'].includes(inv.paymentStatus)

            return (
              <div key={inv._id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={`${inv.uid?.firstName} ${inv.uid?.lastName}`}
                    src={inv.uid?.avatar?.secureUrl}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {inv.uid?.firstName} {inv.uid?.lastName}
                      </p>
                      {statusBadge(inv.paymentStatus)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{inv.uid?.email}</p>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="font-bold text-gray-900 dark:text-white">${inv.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Package</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">
                          {inv.description || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Submitted</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">
                          {inv.createdAt ? format(new Date(inv.createdAt), 'MMM dd, yyyy') : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Method</p>
                        <p className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
                          <CreditCard size={12} /> Bank Transfer
                        </p>
                      </div>
                    </div>

                    {/* Proof */}
                    {inv.paymentProof && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1.5">Transfer Proof</p>
                        <a
                          href={inv.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 btn-secondary btn-sm">
                          <ExternalLink size={12} /> View Document
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Approve */}
                    <button
                      onClick={() => {
                        if (isApproved) return
                        if (confirm(`Approve bank transfer for ${inv.uid?.firstName}?`))
                          updateStatusMutation.mutate({ id: inv._id, status: 'paid' })
                      }}
                      disabled={isThis || isApproved}
                      className={`btn-sm flex items-center gap-1.5 ${
                        isApproved
                          ? 'btn-secondary opacity-60 cursor-default'
                          : 'btn-primary'
                      }`}>
                      <CheckCircle size={13} />
                      {isThis && !isApproved ? 'Processing...' : isApproved ? 'Approved' : 'Approve'}
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => {
                        if (isRejected) return
                        if (confirm(`Reject bank transfer for ${inv.uid?.firstName}?`))
                          updateStatusMutation.mutate({ id: inv._id, status: 'rejected' })
                      }}
                      disabled={isThis || isRejected}
                      className={`btn-sm flex items-center gap-1.5 ${
                        isRejected
                          ? 'btn-secondary opacity-60 cursor-default'
                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      }`}>
                      <XCircle size={13} />
                      {isRejected ? 'Rejected' : 'Reject'}
                    </button>

                    {/* Mark Pending (only if approved/rejected) */}
                    {(isApproved || isRejected) && (
                      <button
                        onClick={() => {
                          if (confirm(`Mark as pending again?`))
                            updateStatusMutation.mutate({ id: inv._id, status: 'pending' })
                        }}
                        disabled={isThis}
                        className="btn-sm btn-outline flex items-center gap-1.5 text-xs">
                        <Clock size={12} />
                        Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}