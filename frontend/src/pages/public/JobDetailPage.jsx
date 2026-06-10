import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MapPin, Briefcase, Clock, DollarSign, Users, Building2, Bookmark, BookmarkCheck, Share2, ArrowLeft, CheckCircle, AlertCircle, Globe } from 'lucide-react'
import { jobsAPI, applicationAPI } from '@/services/api'
import { Badge, Modal, Skeleton, StatusBadge, Avatar } from '@/components/common/UI'
import { formatDistanceToNow, format } from 'date-fns'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function JobDetailPage() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [applyModal, setApplyModal] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [shortlisted, setShortlisted] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsAPI.getOne(id).then(r => {
      setShortlisted(r.data.isShortlisted)
      return r.data
    }),
  })

  const applyMutation = useMutation({
    mutationFn: (formData) => applicationAPI.apply(formData),
    onSuccess: () => {
      toast.success('Application submitted successfully! 🎉')
      setApplyModal(false)
      qc.invalidateQueries(['job', id])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to apply')
    }
  })

  const shortlistMutation = useMutation({
    mutationFn: () => jobsAPI.shortlist(job._id),
    onSuccess: () => {
      setShortlisted(prev => !prev)
      toast.success(shortlisted ? 'Removed from shortlist' : 'Added to shortlist ⭐')
    }
  })

  const job = data?.job
  const similarJobs = data?.similarJobs || []

  if (isLoading) return <JobDetailSkeleton />
  if (!job) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job not found</h2>
        <Link to="/jobs" className="btn-primary mt-4 inline-flex">Browse Jobs</Link>
      </div>
    </div>
  )

  const isExpired = job.expiresAt && new Date() > new Date(job.expiresAt)
  const isOwner = user?._id === job.uid

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      <div className="container-custom">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Main Content ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="card p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-dark-600">
                  {job.companyId?.logo?.secureUrl
                    ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                    : <Building2 size={26} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">{job.title}</h1>
                  <Link to={`/companies/${job.companyId?.slug || job.companyId?._id}`}
                    className="text-primary-600 hover:underline font-medium">
                    {job.companyId?.name || job.company}
                    {job.companyId?.isVerified && <CheckCircle size={14} className="inline ml-1 text-primary-500" />}
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => shortlistMutation.mutate()}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-dark-600 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors">
                    {shortlisted ? <BookmarkCheck size={18} className="text-primary-600" /> : <Bookmark size={18} />}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-dark-600 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {job.city && <span className="badge badge-gray"><MapPin size={12} />{job.city}</span>}
                {job.workplaceType && <span className="badge badge-primary capitalize">{job.workplaceType}</span>}
                {job.jobType?.title && <span className="badge badge-gray">{job.jobType.title}</span>}
                {job.isUrgent && <span className="badge badge-danger">🔥 Urgent Hiring</span>}
                {job.isFeaturedJob && <span className="badge badge-warning">⭐ Featured</span>}
                {isExpired && <span className="badge badge-danger">Expired</span>}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                {[
                  { icon: DollarSign, label: 'Salary', value: job.hideSalaryRange ? 'Not disclosed' : (job.salaryMin ? `$${job.salaryMin?.toLocaleString()} – $${job.salaryMax?.toLocaleString()}` : 'Negotiable') },
                  { icon: Briefcase, label: 'Experience', value: job.experience ? `${job.experience}+ years` : 'Any' },
                  { icon: Users, label: 'Openings', value: `${job.noOfJobs || 1} position${job.noOfJobs > 1 ? 's' : ''}` },
                  { icon: Clock, label: 'Posted', value: formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <Icon size={16} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Job Description</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }} />
            </div>

            {/* Qualifications */}
            {job.qualifications && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Qualifications</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: job.qualifications }} />
              </div>
            )}

            {/* Skills */}
            {job.prefferdSkills && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Preferred Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.prefferdSkills.split(',').map((skill, i) => (
                    <span key={i} className="badge badge-primary">{skill.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, i) => (
                    <span key={i} className="badge badge-gray">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Similar Jobs</h2>
                <div className="space-y-3">
                  {similarJobs.map(sj => (
                    <Link key={sj._id} to={`/jobs/${sj.slug || sj._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-600 flex-shrink-0">
                        {sj.companyId?.logo?.secureUrl
                          ? <img src={sj.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                          : <Building2 size={16} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">{sj.title}</p>
                        <p className="text-xs text-gray-500 truncate">{sj.companyId?.name}</p>
                      </div>
                      <span className="badge badge-gray capitalize">{sj.workplaceType}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Apply Card */}
            <div className="card p-6 sticky top-24">
              {isExpired ? (
                <div className="text-center py-4">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 dark:text-white">This job has expired</p>
                  <p className="text-sm text-gray-500 mt-1">Application deadline has passed</p>
                </div>
              ) : isOwner ? (
                <Link to={`/employer/jobs/${job._id}/edit`} className="btn-outline w-full justify-center">Edit Job</Link>
              ) : job.jobApplyLink ? (
                <a href={job.jobLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">
                  Apply on Company Site <Globe size={15} />
                </a>
              ) : (
                <button
                  onClick={() => {
                    if (!isAuthenticated) { toast.error('Please login to apply'); return }
                    if (user?.role === 'employer') { toast.error('Employers cannot apply to jobs'); return }
                    setApplyModal(true)
                  }}
                  className="btn-primary w-full justify-center text-base py-3">
                  Apply Now
                </button>
              )}

              {job.expiresAt && !isExpired && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  Apply before {format(new Date(job.expiresAt), 'MMM dd, yyyy')}
                </p>
              )}

              <div className="border-t border-gray-100 dark:border-dark-700 mt-4 pt-4 space-y-2.5 text-sm">
                {job.applicationsCount > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Applications</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{job.applicationsCount}</span>
                  </div>
                )}
                {job.viewsCount > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Views</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{job.viewsCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            {job.companyId && (
              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">About Company</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600">
                    {job.companyId.logo?.secureUrl
                      ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                      : <Building2 size={20} className="text-gray-400 mx-auto mt-3" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{job.companyId.name}</p>
                    {job.companyId.city && <p className="text-xs text-gray-500">{job.companyId.city}</p>}
                  </div>
                </div>
                {job.companyId.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">{job.companyId.description}</p>
                )}
                <Link to={`/companies/${job.companyId.slug || job.companyId._id}`}
                  className="btn-outline w-full justify-center text-sm">
                  View Company Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply for this Job">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <p className="font-semibold text-gray-900 dark:text-white">{job.title}</p>
            <p className="text-sm text-gray-500">{job.companyId?.name || job.company}</p>
          </div>
          <div>
            <label className="label">Cover Message (Optional)</label>
            <textarea value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
              rows={5} placeholder="Tell the employer why you're a great fit for this role..."
              className="input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setApplyModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => applyMutation.mutate({ jobId: job._id, applyMessage })}
              disabled={applyMutation.isPending}
              className="btn-primary flex-1">
              {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function JobDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      <div className="container-custom grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[200, 300, 200].map((h, i) => (
            <div key={i} className="card p-6">
              <Skeleton className={`h-${h === 200 ? '32' : '48'} w-full`} />
            </div>
          ))}
        </div>
        <div className="card p-6 h-64" />
      </div>
    </div>
  )
}
