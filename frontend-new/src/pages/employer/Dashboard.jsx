import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Users, Eye, TrendingUp, Plus, ChevronRight, Clock, CheckCircle } from 'lucide-react'
import { applicationAPI, jobsAPI } from '@/services/api'
import { StatCard, StatusBadge, EmptyState, SkeletonCard, Avatar } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockChartData = [
  { date: 'Mon', views: 120, applications: 8 },
  { date: 'Tue', views: 180, applications: 12 },
  { date: 'Wed', views: 150, applications: 9 },
  { date: 'Thu', views: 220, applications: 18 },
  { date: 'Fri', views: 195, applications: 15 },
  { date: 'Sat', views: 90, applications: 5 },
  { date: 'Sun', views: 110, applications: 7 },
]

export default function EmpDashboard() {
  const { user } = useAuthStore()

  const { data: overviewData } = useQuery({
    queryKey: ['company-applications-overview'],
    queryFn: () => applicationAPI.companyOverview().then(r => r.data),
  })

  const { data: myJobsData } = useQuery({
    queryKey: ['my-jobs-dashboard', { limit: 5 }],
    queryFn: () => jobsAPI.myJobs({ limit: 5 }).then(r => r.data),
  })

  const stats = overviewData?.stats || []
  const recent = overviewData?.recent || []
  const total = overviewData?.total || 0
  const jobs = myJobsData?.data || []

  const shortlisted = stats.find(s => s._id === 'shortlisted')?.count || 0
  const hired = stats.find(s => s._id === 'hired')?.count || 0
  const inReview = stats.find(s => s._id === 'reviewed')?.count || 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title mb-1">Hello, {user?.firstName}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's your hiring overview</p>
        </div>
        <Link to="/employer/jobs/post" className="btn-primary">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show">
        {[
          { icon: Briefcase, label: 'Active Jobs', value: jobs.filter(j => j.status === 'approved').length, color: 'blue' },
          { icon: Users, label: 'Total Applications', value: total, color: 'purple' },
          { icon: CheckCircle, label: 'Shortlisted', value: shortlisted, color: 'green' },
          { icon: TrendingUp, label: 'Hired', value: hired, color: 'orange' },
        ].map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + Recent Applications */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-5">Weekly Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="apps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#views)" name="Views" strokeWidth={2} />
              <Area type="monotone" dataKey="applications" stroke="#f97316" fill="url(#apps)" name="Applications" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Applications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">Recent Applicants</h2>
            <Link to="/employer/applications" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Users} title="No applications yet" />
          ) : (
            <div className="space-y-3">
              {recent.map(app => (
                <div key={app._id} className="flex items-center gap-3">
                  <Avatar name={`${app.uid?.firstName} ${app.uid?.lastName}`} src={app.uid?.avatar?.secureUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {app.uid?.firstName} {app.uid?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{app.jobId?.title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Jobs */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">My Job Listings</h2>
          <Link to="/employer/jobs" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Manage All <ChevronRight size={14} />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs posted yet"
            action={<Link to="/employer/jobs/post" className="btn-primary btn-sm">Post Your First Job</Link>} />
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Eye size={11} /> {job.viewsCount || 0} views</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {job.applicationsCount || 0} applications</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/employer/applications?jobId=${job._id}`} className="btn-ghost btn-sm">Applicants</Link>
                  <Link to={`/employer/jobs/${job._id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
