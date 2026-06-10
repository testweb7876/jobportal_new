import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, FileText, Bookmark, Bell, TrendingUp, CheckCircle, Clock, XCircle, ChevronRight, Search } from 'lucide-react'
import { applicationAPI, jobsAPI } from '@/services/api'
import { StatCard, SkeletonCard, StatusBadge, EmptyState } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'

export default function JSDashboard() {
  const { user } = useAuthStore()

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications', { limit: 5 }],
    queryFn: () => applicationAPI.myApplications({ limit: 5 }).then(r => r.data),
  })

  const { data: featuredJobs } = useQuery({
    queryKey: ['featured-jobs-dash'],
    queryFn: () => jobsAPI.getFeatured().then(r => r.data?.jobs?.slice(0, 4) || []),
  })

  const applications = appsData?.data || []
  const total = appsData?.pagination?.total || 0

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title mb-1">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's your job search overview</p>
        </div>
        <Link to="/jobs" className="btn-primary hidden md:flex">
          <Search size={15} /> Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show">
        {[
          { icon: Briefcase, label: 'Total Applied', value: total, color: 'blue' },
          { icon: CheckCircle, label: 'Shortlisted', value: statusCounts.shortlisted || 0, color: 'green' },
          { icon: Clock, label: 'In Review', value: statusCounts.reviewed || 0, color: 'orange' },
          { icon: TrendingUp, label: 'Interviews', value: statusCounts.interview_scheduled || 0, color: 'purple' },
        ].map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">Recent Applications</h2>
            <Link to="/jobseeker/applications" className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {appsLoading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : applications.length === 0 ? (
            <EmptyState icon={Briefcase} title="No applications yet"
              description="Start applying to jobs that match your skills"
              action={<Link to="/jobs" className="btn-primary btn-sm">Browse Jobs</Link>} />
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {app.jobId?.title || 'Job'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {app.jobId?.company} · {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Completion */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">Profile Completion</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
              <span className="text-sm font-bold text-primary-600">{user?.profileCompleted || 40}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 mb-3">
              <div className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${user?.profileCompleted || 40}%` }} />
            </div>
            <Link to="/jobseeker/profile" className="btn-outline w-full justify-center text-sm">Complete Profile</Link>
          </div>

          {/* Recommended Jobs */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">Recommended Jobs</h3>
            {featuredJobs?.length === 0 ? (
              <p className="text-sm text-gray-500">No recommendations yet</p>
            ) : (
              <div className="space-y-2.5">
                {(featuredJobs || []).slice(0, 4).map(job => (
                  <Link key={job._id} to={`/jobs/${job.slug || job._id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-dark-600">
                      {job.companyId?.logo?.secureUrl
                        ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                        : <Briefcase size={14} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">{job.title}</p>
                      <p className="text-xs text-gray-400 truncate">{job.companyId?.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link to="/jobs" className="block text-center text-xs text-primary-600 hover:underline mt-3 font-medium">Browse all jobs →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
