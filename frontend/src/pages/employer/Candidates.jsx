import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User, MapPin, Briefcase, Eye, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resumeAPI } from '@/services/api'
import { Avatar, EmptyState } from '@/components/common/UI'
import { useDebounce } from 'use-debounce'

export default function EmpCandidates() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch] = useDebounce(search, 500)

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', debouncedSearch, page],
    queryFn: () => resumeAPI.getAll({ 
      keyword: debouncedSearch || undefined, 
      page, 
      limit: 12 
    }).then(r => r.data),
  })

  const resumes = data?.data || []
  const total = data?.pagination?.total || 0
  const totalPages = data?.pagination?.pages || 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Browse Candidates</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {total > 0 ? `${total} candidates found` : 'Search and discover qualified candidates'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by skills, title, location..."
          className="input pl-10 h-11"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-48 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && resumes.length === 0 && (
        <EmptyState
          icon={User}
          title={debouncedSearch ? 'No candidates found' : 'No candidates yet'}
          description={debouncedSearch ? `No results for "${debouncedSearch}"` : 'Candidates will appear here once they create resumes.'}
        />
      )}

      {/* Candidates Grid */}
      {!isLoading && resumes.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map(resume => (
            <div key={resume._id} className="card p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar
                  src={resume.uid?.avatar?.secureUrl}
                  name={`${resume.uid?.firstName} ${resume.uid?.lastName}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {resume.uid?.firstName} {resume.uid?.lastName}
                  </h3>
                  <p className="text-xs text-primary-600 font-medium truncate">
                    {resume.applicationTitle}
                  </p>
                  {resume.uid?.city && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {resume.uid.city}
                    </p>
                  )}
                </div>
                {resume.isFeaturedResume && (
                  <Star size={14} className="text-amber-500 fill-current flex-shrink-0" />
                )}
              </div>

              {/* Skills */}
              {resume.skills && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {resume.skills}
                </p>
              )}

              {/* ATS Score */}
              {resume.atsScore > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">ATS Score</span>
                    <span className="font-bold text-primary-600">{resume.atsScore}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full">
                    <div className="h-1.5 bg-primary-600 rounded-full"
                      style={{ width: `${resume.atsScore}%` }} />
                  </div>
                </div>
              )}

              {/* Tags */}
              {resume.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {resume.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="badge badge-gray text-xs">#{tag}</span>
                  ))}
                  {resume.tags.length > 3 && (
                    <span className="badge badge-gray text-xs">+{resume.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                <Link
                  to={`/employer/candidates/${resume._id}`}
                  className="btn-primary btn-sm flex-1 justify-center">
                  <Eye size={13} /> View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm">
            Previous
          </button>
          <span className="text-sm text-gray-500 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary btn-sm">
            Next
          </button>
        </div>
      )}
    </div>
  )
}