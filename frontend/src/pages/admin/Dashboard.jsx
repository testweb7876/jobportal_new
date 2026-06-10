import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Briefcase, Building2, DollarSign, TrendingUp, AlertTriangle, Activity, CheckCircle } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { StatCard, SkeletonCard, Avatar, StatusBadge, Table } from '@/components/common/UI'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444']

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.dashboard().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminAPI.revenue({ months: 6 }).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const d = data || {}
  const revenue = revenueData?.revenue || []
  const byMethod = revenueData?.byMethod || []

  const chartData = revenue.map(r => ({
    name: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][r._id.month]}`,
    revenue: r.total,
    count: r.count,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Platform overview and analytics</p>
      </div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show">
        {[
          { icon: Users, label: 'Total Users', value: d.users?.total?.toLocaleString() || '0', change: 12, color: 'blue' },
          { icon: Briefcase, label: 'Active Jobs', value: d.jobs?.active?.toLocaleString() || '0', change: 8, color: 'green' },
          { icon: Building2, label: 'Companies', value: d.companies?.total?.toLocaleString() || '0', change: 5, color: 'purple' },
          { icon: DollarSign, label: 'Total Revenue', value: `$${(d.revenue?.total || 0).toLocaleString()}`, change: 15, color: 'orange' },
        ].map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Users This Month', value: d.users?.thisMonth || 0, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Pending Jobs', value: d.jobs?.pending || 0, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Applications', value: d.applications?.total || 0, icon: Activity, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending Reports', value: d.pendingReports || 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Monthly Revenue</h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Method */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">Revenue by Method</h2>
          {byMethod.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byMethod} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Users + Pending Jobs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Recent Registrations</h2>
          {d.recentUsers?.length === 0 ? (
            <p className="text-sm text-gray-400">No recent users</p>
          ) : (
            <div className="space-y-3">
              {(d.recentUsers || []).map(user => (
                <div key={user._id} className="flex items-center gap-3">
                  <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge badge-gray capitalize text-xs">{user.role}</span>
                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Jobs */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Pending Job Reviews</h2>
          {d.recentJobs?.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={16} /> <span className="text-sm">All jobs reviewed!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {(d.recentJobs || []).slice(0, 5).map(job => (
                <div key={job._id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">by {job.uid?.firstName} {job.uid?.lastName}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
              <a href="/admin/jobs" className="text-xs text-primary-600 hover:underline font-medium">
                Review all pending jobs →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
