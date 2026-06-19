import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { StatCard } from '../../components/common/UI'
import {
  DollarSign,
  Receipt,
  TrendingUp,
  CreditCard
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie
} from 'recharts'

export default function Revenue() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminAPI.revenue() // fixed
  })

  const revenue = data?.data?.revenue || []
  const byMethod = data?.data?.byMethod || []

  const totalRevenue = byMethod.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  )

  const totalInvoices = byMethod.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₹${totalRevenue}`}
          color="green"
        />

        <StatCard
          icon={Receipt}
          label="Total Invoices"
          value={totalInvoices}
          color="blue"
        />

        <StatCard
          icon={CreditCard}
          label="Payment Methods"
          value={byMethod.length}
          color="purple"
        />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue}>
            <XAxis dataKey="_id.month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Method Chart */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byMethod}
              dataKey="total"
              nameKey="_id"
              outerRadius={100}
              label
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}