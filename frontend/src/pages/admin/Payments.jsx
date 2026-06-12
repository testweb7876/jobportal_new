import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Search, RefreshCw, Eye, X, ExternalLink } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Avatar, Badge, Skeleton } from '@/components/common/UI'
import { format } from 'date-fns'

export default function AdminPayments() {
  const [page, setPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-payments', page, paymentStatus, payMethod],
    queryFn: () =>
      adminAPI.getInvoices({ page, limit: 20, paymentStatus, payMethod })
        .then((res) => res.data),
  })

  const invoices = data?.data || []
  const pagination = data?.pagination || {}

  const getBadge = (status) => {
    switch (status) {
      case 'paid':      return <Badge variant="success">Paid</Badge>
      case 'pending':   return <Badge variant="warning">Pending</Badge>
      case 'failed':    return <Badge variant="danger">Failed</Badge>
      case 'refunded':  return <Badge variant="secondary">Refunded</Badge>
      default:          return <Badge>{status}</Badge>
    }
  }

  const getRefundBadge = (status) => {
    switch (status) {
      case 'requested':  return <Badge variant="warning">Requested</Badge>
      case 'processing': return <Badge variant="warning">Processing</Badge>
      case 'refunded':   return <Badge variant="success">Refunded</Badge>
      default:           return null
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Payments Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage all payment transactions
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-outline">
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <select
              className="input pl-10"
              value={paymentStatus}
              onChange={(e) => { setPage(1); setPaymentStatus(e.target.value) }}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <select
            className="input"
            value={payMethod}
            onChange={(e) => { setPage(1); setPayMethod(e.target.value) }}
          >
            <option value="">All Methods</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">Paypal</option>
            <option value="bank">Bank Transfer</option>
            <option value="free">Free</option>
            <option value="manual">Manual</option>
          </select>

          <div className="flex items-center justify-end text-sm text-gray-500">
            Total Records: {pagination.total || 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead>
                  <tr className="border-b dark:border-dark-700">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Method</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? invoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-b dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={`${invoice.uid?.firstName} ${invoice.uid?.lastName}`}
                            src={invoice.uid?.avatar?.secureUrl}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {invoice.uid?.firstName} {invoice.uid?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{invoice.uid?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">${invoice.amount}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} />
                          <span className="capitalize">{invoice.payMethod || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4">{getBadge(invoice.paymentStatus)}</td>
                      <td className="p-4 capitalize">{invoice.type}</td>
                      <td className="p-4 text-sm">
                        {invoice.createdAt ? format(new Date(invoice.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelected(invoice)}
                          className="btn-outline btn-sm flex items-center gap-1.5"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center p-4 border-t dark:border-dark-700">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-outline disabled:opacity-50"
                >Previous</button>
                <span className="text-sm">Page {pagination.page} of {pagination.pages}</span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-outline disabled:opacity-50"
                >Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b dark:border-dark-700">
              <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">
                Payment Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <Avatar
                  name={`${selected.uid?.firstName} ${selected.uid?.lastName}`}
                  src={selected.uid?.avatar?.secureUrl}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selected.uid?.firstName} {selected.uid?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selected.uid?.email}</p>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Invoice Info
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Invoice ID',   value: selected._id },
                    { label: 'Description',  value: selected.description || '—' },
                    { label: 'Type',         value: selected.type },
                    { label: 'Amount',       value: `$${selected.amount}` },
                    { label: 'Method',       value: selected.payMethod || '—' },
                    { label: 'Status',       value: getBadge(selected.paymentStatus) },
                    { label: 'Created',      value: selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM yyyy, hh:mm a') : '—' },
                    { label: 'Paid At',      value: selected.paidAt ? format(new Date(selected.paidAt), 'dd MMM yyyy, hh:mm a') : '—' },
                    { label: 'Transaction ID', value: selected.transactionId || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payer Details */}
              {(selected.payerName || selected.payerEmail || selected.payerContactNumber) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Payer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Name',    value: selected.payerName },
                      { label: 'Email',   value: selected.payerEmail },
                      { label: 'Phone',   value: selected.payerContactNumber },
                      { label: 'Address', value: selected.payerAddress },
                      { label: 'Txn No.', value: selected.payerTransactionNumber },
                    ].filter(r => r.value).map(({ label, value }) => (
                      <div key={label} className="p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Info */}
              {selected.refundStatus && selected.refundStatus !== 'none' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Refund Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Refund Status', value: getRefundBadge(selected.refundStatus) },
                      { label: 'Reason',        value: selected.refundReason || '—' },
                      { label: 'Refunded At',   value: selected.refundedAt ? format(new Date(selected.refundedAt), 'dd MMM yyyy') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selected.paymentProof && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Payment Proof
                  </h3>
                  <a
                    href={selected.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 btn-secondary btn-sm"
                  >
                    <ExternalLink size={13} /> View Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}