import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Building2, MapPin, Globe, Users, CheckCircle, Briefcase, Heart } from 'lucide-react'
import { companyAPI } from '@/services/api'
import { Badge, EmptyState } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const [following, setFollowing] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyAPI.getOne(id).then(r => { setFollowing(r.data.isFollowing); return r.data }),
  })

  const followMutation = useMutation({
    mutationFn: () => companyAPI.follow(id),
    onSuccess: () => { setFollowing(p => !p); toast.success(following ? 'Unfollowed' : 'Following company!') }
  })

  const company = data?.company
  const recentJobs = data?.recentJobs || []
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"/></div>
  if (!company) return <div className="min-h-screen flex items-center justify-center"><p>Company not found</p></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      <div className="container-custom">
        <div className="card p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-dark-700 overflow-hidden border border-gray-200 dark:border-dark-600 flex-shrink-0">
              {company.logo?.secureUrl ? <img src={company.logo.secureUrl} alt="" className="w-full h-full object-cover"/> : <Building2 size={36} className="text-gray-400 m-auto mt-6"/>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{company.name}</h1>
                {company.isVerified && <CheckCircle size={20} className="text-primary-500"/>}
              </div>
              {company.tagline && <p className="text-gray-500 dark:text-gray-400 mb-3">{company.tagline}</p>}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {company.city && <span className="flex items-center gap-1"><MapPin size={14}/>{company.city}</span>}
                {company.url && <a href={company.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline"><Globe size={14}/>{company.url}</a>}
                <span className="flex items-center gap-1"><Users size={14}/>{company.followersCount || 0} followers</span>
                <span className="flex items-center gap-1"><Briefcase size={14}/>{recentJobs.length} open jobs</span>
              </div>
            </div>
            <button onClick={() => { if(!isAuthenticated){toast.error('Please login');return} followMutation.mutate() }}
              className={following ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}>
              <Heart size={15} className={following ? 'fill-current' : ''}/> {following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {company.description && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{company.description}</p>
              </div>
            )}
            {company.gallery?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Gallery</h2>
                <div className="grid grid-cols-3 gap-3">
                  {company.gallery.map((img, i) => (
                    <img key={i} src={img.secureUrl} alt={img.caption || ''} className="rounded-xl h-32 w-full object-cover"/>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-5">
            <div className="card p-6">
              <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Open Positions</h3>
              {recentJobs.length === 0 ? <EmptyState icon={Briefcase} title="No open positions" /> : (
                <div className="space-y-3">
                  {recentJobs.map(job => (
                    <Link key={job._id} to={`/jobs/${job.slug || job._id}`}
                      className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{job.workplaceType} · {job.city}</p>
                    </Link>
                  ))}
                </div>
              )}
              <Link to={`/jobs?company=${company._id}`} className="btn-outline w-full justify-center text-sm mt-4">View All Jobs</Link>
            </div>
            {company.socialLinks && Object.values(company.socialLinks).some(Boolean) && (
              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Social Links</h3>
                <div className="space-y-2">
                  {Object.entries(company.socialLinks).filter(([,v]) => v).map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline capitalize">
                      <Globe size={14}/> {key}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
