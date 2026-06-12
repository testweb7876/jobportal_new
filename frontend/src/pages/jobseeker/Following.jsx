// src/pages/jobseeker/Following.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, MapPin, CheckCircle, Briefcase, Users, Heart } from 'lucide-react'
import { followersAPI, companyAPI } from '@/services/api'
import { EmptyState } from '@/components/common/UI'
import toast from 'react-hot-toast'

export default function Following() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['following'],
    queryFn: () => followersAPI.getFollowing().then(r => r.data?.companies || r.data?.data || []),
  })

  const unfollowMutation = useMutation({
    mutationFn: (companyId) => companyAPI.follow(companyId),
    onSuccess: () => {
      toast.success('Unfollowed')
      qc.invalidateQueries(['following'])
    },
    onError: () => toast.error('Action failed'),
  })

  const companies = data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Following</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} you follow
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-40 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Not following any companies yet"
          description="Follow companies to keep up with their latest job postings."
          action={<Link to="/companies" className="btn-primary">Browse Companies</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map(company => (
            <div key={company._id} className="card p-5 group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-dark-600 flex-shrink-0">
                  {company.logo?.secureUrl
                    ? <img src={company.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                    : <Building2 size={22} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/companies/${company.slug || company._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors truncate">
                      {company.name}
                    </Link>
                    {company.isVerified && (
                      <CheckCircle size={13} className="text-primary-500 flex-shrink-0" />
                    )}
                  </div>
                  {company.city && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {company.city}
                    </p>
                  )}
                </div>
              </div>

              {company.tagline && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {company.tagline}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Briefcase size={11} /> {company.jobsCount || 0} open jobs
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} /> {company.followersCount || 0} followers
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                <Link
                  to={`/companies/${company.slug || company._id}`}
                  className="btn-outline btn-sm flex-1 justify-center text-xs">
                  View Company
                </Link>
                <button
                  onClick={() => unfollowMutation.mutate(company._id)}
                  disabled={unfollowMutation.isPending}
                  className="btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3"
                  title="Unfollow">
                  <Heart size={13} className="fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}