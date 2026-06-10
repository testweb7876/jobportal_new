import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bookmark, MapPin, Building2, Clock } from 'lucide-react'
import { jobsAPI } from '@/services/api'
import { EmptyState, Badge } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'

export default function JSShortlisted() {
  const { data, isLoading } = useQuery({
    queryKey: ['shortlisted-jobs'],
    queryFn: () => jobsAPI.getShortlisted().then(r => r.data?.jobs || []),
  })
  const jobs = data || []
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Shortlisted Jobs</h1>
        <p className="text-gray-500 dark:text-gray-400">{jobs.length} saved jobs</p>
      </div>
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="card h-32 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Bookmark} title="No shortlisted jobs" description="Save jobs while browsing to review them later."
          action={<Link to="/jobs" className="btn-primary">Browse Jobs</Link>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <Link key={job._id} to={`/jobs/${job.slug || job._id}`}
              className="card p-5 block group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-600 flex-shrink-0">
                  {job.companyId?.logo?.secureUrl ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" /> : <Building2 size={18} className="text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 transition-colors">{job.title}</h3>
                  <p className="text-xs text-gray-500">{job.companyId?.name || job.company}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {job.city && <Badge variant="gray"><MapPin size={10} />{job.city}</Badge>}
                {job.workplaceType && <Badge variant="primary" className="capitalize">{job.workplaceType}</Badge>}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-2"><Clock size={11} />{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
