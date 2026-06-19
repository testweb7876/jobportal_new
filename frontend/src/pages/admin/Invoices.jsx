import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { Table } from '../../components/common/UI'

export default function Invoices() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => adminAPI.getInvoices()
  })

  // fixed path
  const invoices = data?.data?.data || []

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold mb-4">Invoices</h2>

      <Table headers={['User', 'Amount', 'Method', 'Status', 'Date']}>
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td className="py-3 px-4">
                {invoice.uid?.firstName} {invoice.uid?.lastName}
              </td>

              <td className="py-3 px-4">
                ₹{invoice.amount}
              </td>

              <td className="py-3 px-4 capitalize">
                {invoice.payMethod}
              </td>

              <td className="py-3 px-4 capitalize">
                {invoice.paymentStatus}
              </td>

              <td className="py-3 px-4">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center py-6 text-gray-500">
              No invoices found
            </td>
          </tr>
        )}
      </Table>
    </div>
  )
}