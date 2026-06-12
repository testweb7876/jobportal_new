// src/pages/shared/Interviews.jsx
// Use for BOTH /employer/interviews and /jobseeker/interviews
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Video, MapPin, User, Briefcase } from 'lucide-react'
import { interviewsAPI } from '@/services/api'
import { Avatar, EmptyState, StatusBadge } from '@/components/common/UI'
import { format, formatDistanceToNow, isFuture } from 'date-fns'
import useAuthStore from '@/store/authStore'
import { clsx } from 'clsx'

// ── add to src/services/api.js ────────────────────────────────────────────────
// export const interviewsAPI = { getUpcoming: () => api.get('/interviews') }
// ─────────────────────────────────────────────────────────────────────────────

const INTERVIEW_TYPE_ICON = {
  video:    <Video size={14} className="text-blue-500" />,
  onsite:   <MapPin size={14} className="text-emerald-500" />,
  phone:    <Clock size={14} className="text-purple-500" />,
  default:  <Calendar size={14} className="text-gray-400" />,
}

export default function Interviews() {
  const { user } = useAuthStore()
  const isEmployer = user?.role === 'employer'

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsAPI.getUpcoming().then(r => r.data?.data || []),
    refetchInterval: 60000,
  })

  const interviews = data || []
  const upcoming   = interviews.filter(a => a.interviewDate && isFuture(new Date(a.interviewDate)))
  const past       = interviews.filter(a => a.interviewDate && !isFuture(new Date(a.interviewDate)))

  const Section = ({ title, items }) => (
    items.length === 0 ? null : (
      <div>
        <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(app => (
            <InterviewCard key={app._id} app={app} isEmployer={isEmployer} />
          ))}
        </div>
      </div>
    )
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Interviews</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {interviews.length === 0
            ? 'No scheduled interviews'
            : `${upcoming.length} upcoming · ${past.length} past`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-36 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No interviews scheduled"
          description={isEmployer
            ? 'Schedule interviews by updating application status to "Interview Scheduled".'
            : 'Your scheduled interviews will appear here.'}
          action={
            isEmployer
              ? <Link to="/employer/applications" className="btn-primary">View Applications</Link>
              : <Link to="/jobseeker/applications" className="btn-primary">View Applications</Link>
          }
        />
      ) : (
        <>
          <Section title="Upcoming Interviews" items={upcoming} />
          <Section title="Past Interviews"     items={past} />
        </>
      )}
    </div>
  )
}

function InterviewCard({ app, isEmployer }) {
  const interviewDate = app.interviewDate ? new Date(app.interviewDate) : null
  const isUpcoming    = interviewDate && isFuture(interviewDate)

  return (
    <div className={clsx(
      'card p-5 border-l-4',
      isUpcoming ? 'border-l-primary-500' : 'border-l-gray-300 dark:border-l-dark-600'
    )}>
      {/* Job info */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
          <Briefcase size={16} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {app.jobId?.title || 'Job Position'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {app.jobId?.company || app.jobId?.companyId?.name}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Candidate / Employer info */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar
          name={isEmployer
            ? `${app.uid?.firstName} ${app.uid?.lastName}`
            : `${app.jobId?.uid?.firstName || ''} ${app.jobId?.uid?.lastName || ''}`}
          size="sm"
        />
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
            {isEmployer
              ? `${app.uid?.firstName} ${app.uid?.lastName}`
              : 'Interview with employer'}
          </p>
          <p className="text-xs text-gray-400">{isEmployer ? app.uid?.email : ''}</p>
        </div>
      </div>

      {/* Date & time */}
      {interviewDate && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Calendar size={13} className="text-primary-600" />
            {format(interviewDate, 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Clock size={13} className="text-primary-600" />
            {format(interviewDate, 'hh:mm a')}
          </div>
          {app.interviewType && (
            <div className="flex items-center gap-1.5 capitalize">
              {INTERVIEW_TYPE_ICON[app.interviewType] || INTERVIEW_TYPE_ICON.default}
              {app.interviewType}
            </div>
          )}
        </div>
      )}

      {interviewDate && (
        <p className={clsx(
          'text-xs mt-2 font-medium',
          isUpcoming ? 'text-primary-600' : 'text-gray-400'
        )}>
          {isUpcoming
            ? `In ${formatDistanceToNow(interviewDate)}`
            : `${formatDistanceToNow(interviewDate, { addSuffix: true })}`}
        </p>
      )}

      {app.employerNotes && (
        <p className="text-xs text-gray-500 italic mt-2 border-t border-gray-100 dark:border-dark-700 pt-2">
          "{app.employerNotes}"
        </p>
      )}
    </div>
  )
}