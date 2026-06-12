// src/pages/employer/JobAnalytics.jsx
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { jobsAPI } from '@/services/api'
import { StatCard } from '@/components/common/UI'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#gray']

export default function JobAnalytics() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['job-analytics', id],
    queryFn: () => jobsAPI.analytics(id).then(r => r.data),
  })

  const { data: jobData } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsAPI.getOne(id).then(r => r.data?.job),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  const analytics = data || {}
  const statusBreakdown = analytics.statusBreakdown || []

  // pie chart data
  const pieData = statusBreakdown.map(s => ({
    name: s._id?.replace(/_/g, ' '),
    value: s.count,
  }))

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/employer/jobs" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title mb-0">{jobData?.title || 'Job Analytics'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Performance overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Eye,         label: 'Total Views',        value: analytics.viewsCount        || 0, color: 'blue' },
          { icon: Users,       label: 'Applications',       value: analytics.applicationsCount || 0, color: 'purple' },
          { icon: CheckCircle, label: 'Shortlisted',        value: statusBreakdown.find(s => s._id === 'shortlisted')?.count || 0, color: 'green' },
          { icon: TrendingUp,  label: 'Hired',              value: statusBreakdown.find(s => s._id === 'hired')?.count       || 0, color: 'orange' },
        ].map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status breakdown bar */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">
            Applications by Status
          </h2>
          {statusBreakdown.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No applications yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusBreakdown.map(s => ({ name: s._id?.replace(/_/g, ' '), count: s.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-5">
            Status Distribution
          </h2>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status table */}
      {statusBreakdown.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">
            Detailed Breakdown
          </h2>
          <div className="space-y-3">
            {statusBreakdown.map((s, i) => {
              const total = statusBreakdown.reduce((acc, x) => acc + x.count, 0)
              const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0
              return (
                <div key={s._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700 dark:text-gray-200">
                      {s._id?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}