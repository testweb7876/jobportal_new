import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Building2, MapPin, Globe, Users, CheckCircle, Briefcase,
  Heart, Linkedin, Twitter, Youtube, Facebook, Instagram,
  Star, Award, Eye, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { companyAPI } from '@/services/api'
import { EmptyState } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

/* ── social link config ────────────────────────────────────── */
const SOCIAL_ICONS = {
  linkedin:  { Icon: Linkedin,  label: 'LinkedIn'  },
  twitter:   { Icon: Twitter,   label: 'Twitter'   },
  facebook:  { Icon: Facebook,  label: 'Facebook'  },
  instagram: { Icon: Instagram, label: 'Instagram' },
  youtube:   { Icon: Youtube,   label: 'YouTube'   },
  website:   { Icon: Globe,     label: 'Website'   },
}

/* ── gallery lightbox ──────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
        <X size={18} className="text-white" />
      </button>

      {images.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
          <ChevronRight size={20} className="text-white" />
        </button>
      </>}

      <div onClick={e => e.stopPropagation()} className="max-w-3xl w-full px-16">
        <img src={images[current].secureUrl} alt={images[current].caption || ''}
          className="w-full max-h-[80vh] object-contain rounded-xl" />
        {images[current].caption && (
          <p className="text-center text-sm text-white/70 mt-3">{images[current].caption}</p>
        )}
        {images.length > 1 && (
          <p className="text-center text-xs text-white/40 mt-1">{current + 1} / {images.length}</p>
        )}
      </div>
    </div>
  )
}

export default function CompanyDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const [following, setFollowing] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index or null

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyAPI.getOne(id).then(r => {
      setFollowing(r.data.isFollowing)
      return r.data
    }),
  })

  const followMutation = useMutation({
    mutationFn: () => companyAPI.follow(id),
    onSuccess: () => {
      setFollowing(p => !p)
      toast.success(following ? 'Unfollowed' : 'Following company!')
    },
  })

  /* ── loading / not found ────────────────────────────────── */
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  const company = data?.company
  const recentJobs = data?.recentJobs || []

  if (!company) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Company not found</p>
        <Link to="/companies" className="btn-primary mt-4 inline-flex">Browse Companies</Link>
      </div>
    </div>
  )

  const gallery = company.gallery || []
  const socialEntries = Object.entries(company.socialLinks || {}).filter(([, v]) => v)
  const hasAddress = company.address1 || company.address2 || company.city

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8">
      {lightbox !== null && (
        <Lightbox images={gallery} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="container-custom space-y-6">

        {/* ── Hero Card ─────────────────────────────────────────── */}
        <div className="card p-8">
          <div className="flex items-start gap-6">

            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-dark-700 overflow-hidden border border-gray-200 dark:border-dark-600 flex-shrink-0 flex items-center justify-center">
              {company.logo?.secureUrl
                ? <img src={company.logo.secureUrl} alt={company.name} className="w-full h-full object-cover" />
                : <Building2 size={36} className="text-gray-400" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{company.name}</h1>
                {company.isVerified && (
                  <CheckCircle size={20} className="text-primary-500 flex-shrink-0" />
                )}
                {company.isGoldCompany && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                    <Star size={11} className="fill-current" /> Gold
                  </span>
                )}
                {company.isFeaturedCompany && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                    <Award size={11} /> Featured
                  </span>
                )}
              </div>

              {company.tagline && (
                <p className="text-gray-500 dark:text-gray-400 mb-3">{company.tagline}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
                {company.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {company.city}
                  </span>
                )}
                {company.url && (
                  <a href={company.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:underline">
                    <Globe size={14} /> {company.url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Users size={14} /> {company.followersCount || 0} followers
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> {recentJobs.length} open jobs
                </span>
                {company.hits > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={14} /> {company.hits} views
                  </span>
                )}
              </div>
            </div>

            {/* Follow button */}
            <button
              onClick={() => {
                if (!isAuthenticated) { toast.error('Please login to follow'); return }
                followMutation.mutate()
              }}
              disabled={followMutation.isPending}
              className={`flex items-center gap-2 flex-shrink-0 ${following ? 'btn-secondary' : 'btn-primary'}`}>
              <Heart size={15} className={following ? 'fill-current' : ''} />
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {company.description && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              </div>
            )}

            {/* Address */}
            {hasAddress && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-3">Location</h2>
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {company.address1 && <p>{company.address1}</p>}
                    {company.address2 && <p>{company.address2}</p>}
                    {company.city    && <p>{company.city}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">
                  Gallery <span className="text-sm font-normal text-gray-400">({gallery.length})</span>
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {gallery.map((img, i) => (
                    <button key={img.publicId || i} onClick={() => setLightbox(i)}
                      className="relative rounded-xl overflow-hidden h-32 bg-gray-100 dark:bg-dark-700 group focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <img src={img.secureUrl} alt={img.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                          <p className="text-xs text-white truncate">{img.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-5">

            {/* Open positions */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Open Positions</h3>
              {recentJobs.length === 0
                ? <EmptyState icon={Briefcase} title="No open positions" />
                : (
                  <div className="space-y-2">
                    {recentJobs.map(job => (
                      <Link key={job._id} to={`/jobs/${job.slug || job._id}`}
                        className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {[job.workplaceType, job.city].filter(Boolean).join(' · ')}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              <Link to={`/jobs?company=${company._id}`}
                className="btn-outline w-full justify-center text-sm mt-4 block text-center">
                View All Jobs
              </Link>
            </div>

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">Connect</h3>
                <div className="space-y-2">
                  {socialEntries.map(([key, url]) => {
                    const { Icon, label } = SOCIAL_ICONS[key] || { Icon: Globe, label: key }
                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group">
                        <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                          <Icon size={14} className="text-gray-500 group-hover:text-primary-600 transition-colors" />
                        </span>
                        {label}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            {company.contactEmail && (
              <div className="card p-6">
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-3">Contact</h3>
                <a href={`mailto:${company.contactEmail}`}
                  className="text-sm text-primary-600 hover:underline break-all">
                  {company.contactEmail}
                </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}