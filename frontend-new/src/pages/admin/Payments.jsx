import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Search, RefreshCw } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Badge, Skeleton } from '@/components/common/UI'
import { format } from 'date-fns'

export default function AdminPayments() {
  const [page, setPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [payMethod, setPayMethod] = useState('')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-payments', page, paymentStatus, payMethod],
    queryFn: () =>
      adminAPI.getInvoices({
        page,
        limit: 20,
        paymentStatus,
        payMethod,
      }).then((res) => res.data),
  })

  const invoices = data?.data || []
  const pagination = data?.pagination || {}

  const getBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>

      case 'pending':
        return <Badge variant="warning">Pending</Badge>

      case 'failed':
        return <Badge variant="danger">Failed</Badge>

      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>

      default:
        return <Badge>{status}</Badge>
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

        <button
          onClick={() => refetch()}
          className="btn-outline"
        >
          <RefreshCw
            size={16}
            className={isFetching ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-400"
            />

            <select
              className="input pl-10"
              value={paymentStatus}
              onChange={(e) => {
                setPage(1)
                setPaymentStatus(e.target.value)
              }}
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
            onChange={(e) => {
              setPage(1)
              setPayMethod(e.target.value)
            }}
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
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
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
                  </tr>
                </thead>

                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        className="border-b dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {invoice.uid?.firstName}{' '}
                              {invoice.uid?.lastName}
                            </p>

                            <p className="text-xs text-gray-500">
                              {invoice.uid?.email}
                            </p>
                          </div>
                        </td>

                        <td className="p-4 font-semibold">
                          ${invoice.amount}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} />
                            {invoice.payMethod || '-'}
                          </div>
                        </td>

                        <td className="p-4">
                          {getBadge(invoice.paymentStatus)}
                        </td>

                        <td className="p-4 capitalize">
                          {invoice.type}
                        </td>

                        <td className="p-4 text-sm">
                          {invoice.createdAt
                            ? format(
                                new Date(invoice.createdAt),
                                'dd MMM yyyy'
                              )
                            : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12 text-gray-500"
                      >
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
                >
                  Previous
                </button>

                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-outline disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}