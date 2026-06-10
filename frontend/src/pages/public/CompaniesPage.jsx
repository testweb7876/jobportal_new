import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MapPin, Building2, Users, CheckCircle, Briefcase } from 'lucide-react'
import { companyAPI } from '@/services/api'
import { SkeletonCard, EmptyState, Pagination } from '@/components/common/UI'

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, city, page }],
    queryFn: () => companyAPI.getAll({ keyword: search, city, page, limit: 18 }).then(r => r.data),
    keepPreviousData: true,
  })

  const companies = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 py-10">
        <div className="container-custom text-center">
          <h1 className="page-title mb-2">Explore Companies</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Discover where you want to work next</p>
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Company name or industry..." className="input pl-10 h-11" />
            </div>
            <div className="relative w-48">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={city} onChange={e => setCity(e.target.value)}
                placeholder="City..." className="input pl-10 h-11" />
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState icon={Building2} title="No companies found" description="Try different search terms" />
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{pagination.total} companies found</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {companies.map((company, i) => (
                <motion.div key={company._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link to={`/companies/${company.slug || company._id}`}
                    className="card p-5 block group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-dark-600 flex-shrink-0">
                        {company.logo?.secureUrl
                          ? <img src={company.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                          : <Building2 size={22} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">{company.name}</h3>
                          {company.isVerified && <CheckCircle size={14} className="text-primary-500 flex-shrink-0" />}
                        </div>
                        {company.city && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{company.city}</p>}
                      </div>
                    </div>
                    {company.tagline && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{company.tagline}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-dark-700">
                      <span className="flex items-center gap-1"><Briefcase size={11} />{company.jobsCount || 0} open jobs</span>
                      <span className="flex items-center gap-1"><Users size={11} />{company.followersCount || 0} followers</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
