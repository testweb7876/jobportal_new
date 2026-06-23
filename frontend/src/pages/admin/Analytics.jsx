import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/services/api'
import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444']

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.getAnalytics({ days: 30 }).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="card p-6 h-72 animate-pulse bg-gray-100 dark:bg-dark-800" />
        ))}
      </div>
    )
  }

  const d = data || {}
  const userGrowth        = d.userGrowth        || []
  const jobGrowth         = d.jobGrowth          || []
  const applicationGrowth = d.applicationGrowth  || []
  const roleBreakdown     = d.roleBreakdown       || []
  const topEmployers      = d.topEmployers        || []
  const topCategories     = d.topCategories       || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Platform Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Last 30 days overview</p>
      </div>

      {/* Growth Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ChartCard title="User Signups" icon={Users} color="blue">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#eff6ff" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Job Postings" icon={Briefcase} color="green">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={jobGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#10b981" fill="#f0fdf4" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications" icon={FileText} color="purple">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={applicationGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#f5f3ff" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Role Breakdown + Top Employers */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">User Role Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleBreakdown} dataKey="count" nameKey="_id"
                cx="50%" cy="50%" outerRadius={80}
                label={({ _id, count }) => `${_id}: ${count}`}>
                {roleBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Top Employers by Jobs</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topEmployers} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="company.name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="jobCount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">Top Job Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {topCategories.slice(0, 10).map((cat, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-center">
              <p className="text-xl font-bold text-primary-600">{cat.count}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{cat.cat?.catTitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, icon: Icon, color, children }) {
  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={15} />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}