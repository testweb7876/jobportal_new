import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MapPin, Filter, X, Building2, Clock, Bookmark, BookmarkCheck, ChevronDown, Sliders } from 'lucide-react'
import { jobsAPI, categoriesAPI } from '@/services/api'
import { SkeletonCard, EmptyState, Pagination, Badge, StatusBadge } from '@/components/common/UI'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

const WORKPLACE_TYPES = ['onsite', 'remote', 'hybrid']

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [shortlisted, setShortlisted] = useState(new Set())
  const { isAuthenticated } = useAuthStore()

  const page = parseInt(searchParams.get('page') || '1')
  const filters = {
    keyword: searchParams.get('keyword') || '',
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    jobType: searchParams.get('jobType') || '',
    workplaceType: searchParams.get('workplaceType') || '',
    salaryMin: searchParams.get('salaryMin') || '',
    experience: searchParams.get('experience') || '',
    sort: searchParams.get('sort') || 'newest',
    page,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsAPI.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories().then(r => r.data?.categories || []),
    staleTime: Infinity,
  })

  const { data: jobTypes } = useQuery({
    queryKey: ['job-types'],
    queryFn: () => categoriesAPI.getJobTypes().then(r => r.data?.jobTypes || []),
    staleTime: Infinity,
  })

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const clearAllFilters = () => {
    setSearchParams({})
  }

  const activeFilterCount = ['category', 'jobType', 'workplaceType', 'salaryMin', 'experience']
    .filter(k => searchParams.get(k)).length

  const toggleShortlist = async (jobId, e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Please login to shortlist jobs'); return }
    try {
      await jobsAPI.shortlist(jobId)
      setShortlisted(prev => {
        const next = new Set(prev)
        if (next.has(jobId)) { next.delete(jobId); toast.success('Removed from shortlist') }
        else { next.add(jobId); toast.success('Added to shortlist') }
        return next
      })
    } catch { toast.error('Something went wrong') }
  }

  const jobs = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* ── Search Header ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 sticky top-16 z-30">
        <div className="container-custom py-4">
          <div className="flex gap-3">
            {/* Keyword */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.keyword}
                onChange={e => setFilter('keyword', e.target.value)}
                placeholder="Search jobs, titles, skills..."
                className="input pl-10 h-11"
              />
            </div>
            {/* Location */}
            <div className="hidden md:flex relative w-52">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.city}
                onChange={e => setFilter('city', e.target.value)}
                placeholder="City or remote..."
                className="input pl-10 h-11"
              />
            </div>
            {/* Filters Toggle */}
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={clsx(
                'flex items-center gap-2 px-4 h-11 rounded-xl border text-sm font-medium transition-colors',
                filtersOpen || activeFilterCount > 0
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-primary-400'
              )}>
              <Sliders size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {filtersOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
              {/* Category */}
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)}
                className="input h-12 text-sm">
                <option value="">All Categories</option>
                {categories?.map(c => <option key={c._id} value={c._id}>{c.catTitle}</option>)}
              </select>
              {/* Job Type */}
              <select value={filters.jobType} onChange={e => setFilter('jobType', e.target.value)}
                className="input h-12 text-sm">
                <option value="">All Job Types</option>
                {jobTypes?.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
              {/* Workplace */}
              <select value={filters.workplaceType} onChange={e => setFilter('workplaceType', e.target.value)}
                className="input h-12 text-sm">
                <option value="">Workplace Type</option>
                {WORKPLACE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              {/* Experience */}
              <select value={filters.experience} onChange={e => setFilter('experience', e.target.value)}
                className="input h-12 text-sm">
                <option value="">Experience</option>
                {[1, 2, 3, 5, 7, 10].map(y => <option key={y} value={y}>{y}+ years</option>)}
              </select>
              {/* Sort */}
              <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
                className="input h-12 text-sm">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="salary_high">Highest Salary</option>
                <option value="salary_low">Lowest Salary</option>
              </select>

              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
                  <X size={14} /> Clear Filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Searching...' : `${pagination.total || 0} jobs found`}
            {filters.keyword && <span className="font-medium text-gray-900 dark:text-white"> for "{filters.keyword}"</span>}
          </p>
        </div>

        {/* Job Cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No jobs found"
            description="Try adjusting your filters or search with different keywords."
            action={<button onClick={clearAllFilters} className="btn-outline">Clear Filters</button>}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {jobs.map((job, i) => (
                <motion.div key={job._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <JobCard job={job} shortlisted={shortlisted.has(job._id)} onShortlist={toggleShortlist} />
                </motion.div>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPage={(p) => { setFilter('page', p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, shortlisted, onShortlist }) {
  return (
    <Link to={`/jobs/${job.slug || job._id}`}
      className="card p-5 block group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 dark:border-dark-600">
          {job.companyId?.logo?.secureUrl
            ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
            : <Building2 size={20} className="text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {job.companyId?.name || job.company}
            {job.companyId?.isVerified && <span className="text-primary-500 ml-1">✓</span>}
          </p>
        </div>
        {/* Shortlist */}
        <button onClick={(e) => onShortlist(job._id, e)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors flex-shrink-0">
          {shortlisted
            ? <BookmarkCheck size={16} className="text-primary-600" />
            : <Bookmark size={16} className="text-gray-400 hover:text-primary-600" />}
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.city && (
          <span className="badge badge-gray text-xs">
            <MapPin size={10} />{job.city}
          </span>
        )}
        {job.workplaceType && (
          <span className="badge badge-primary capitalize text-xs">{job.workplaceType}</span>
        )}
        {job.jobType?.title && (
          <span className="badge badge-gray text-xs">{job.jobType.title}</span>
        )}
        {job.isUrgent && <span className="badge badge-danger text-xs">🔥 Urgent</span>}
        {job.isFeaturedJob && <span className="badge badge-warning text-xs">⭐ Featured</span>}
      </div>

      {/* Salary */}
      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
        {job.currency || '$'}&nbsp;{job.salaryMin?.toLocaleString()}
        {' – '}
        {job.currency || '$'}&nbsp;{job.salaryMax?.toLocaleString()}
        {' / yr'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-700">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </span>
        {job.applicationsCount > 0 && (
          <span className="text-xs text-gray-400">{job.applicationsCount} applied</span>
        )}
      </div>
    </Link>
  )
}
