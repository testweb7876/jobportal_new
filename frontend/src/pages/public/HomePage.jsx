import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Briefcase, Building2, Users, ArrowRight,
  CheckCircle, Zap, Globe, Shield, TrendingUp, Clock, ChevronRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { jobsAPI, companyAPI, categoriesAPI } from '@/services/api'
import api from '@/services/api'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

const features = [
  { icon: Zap,    title: 'Instant Matching',       desc: 'Get matched to relevant jobs the moment you upload your resume.' },
  { icon: Globe,  title: 'Remote & Onsite',         desc: 'Browse remote, hybrid, and onsite roles from verified employers.' },
  { icon: Shield, title: 'Verified Employers Only', desc: 'Every company is reviewed before posting — no spam, no scams.' },
]

export default function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  // Real API data
  const { data: featuredJobs = [] } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: () => jobsAPI.getFeatured().then(r => r.data?.jobs || r.data?.data || []),
  })

  const { data: recentJobs = [] } = useQuery({
    queryKey: ['recent-jobs-home'],
    queryFn: () => jobsAPI.getAll({ limit: 6, sort: 'newest' }).then(r => r.data?.jobs || r.data?.data || []),
  })

  const { data: featuredCompanies = [] } = useQuery({
    queryKey: ['featured-companies-home'],
    queryFn: () => companyAPI.getAll({ limit: 8, verified: true }).then(r => r.data?.companies || r.data?.data || []),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-home'],
    queryFn: () => categoriesAPI.getCategories().then(r => {
      return r.data?.data || r.data?.categories || r.data?.category || r.data || []
    }),
  })

  const { data: statsData } = useQuery({
  queryKey: ['home-stats'],
  queryFn: () =>
    jobsAPI.getPublicStats()
      .then((r) => r.data?.data || r.data)
      .catch(() => null),
})

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (location) params.set('city', location)
    navigate(`/jobs?${params.toString()}`)
  }

  const displayJobs = featuredJobs.length > 0 ? featuredJobs.slice(0, 6) : recentJobs.slice(0, 6)

  return (
    <div className="overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-40 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 py-24">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">

            <motion.p variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              Hiring is live — {statsData?.totalJobs?.toLocaleString() || '50,000'}+ open roles
            </motion.p>

            <motion.h1 variants={fadeUp}
              className="font-display text-5xl md:text-[4.5rem] font-bold text-white mb-6 leading-[1.08] tracking-tight">
              The job search<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-violet-400">
                built around you
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base md:text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Upload your resume once. Get matched to verified openings at companies that are actively hiring.
            </motion.p>

            {/* Search */}
            <motion.form variants={fadeUp} onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 bg-white/8 backdrop-blur-xl p-2 rounded-2xl border border-white/10 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-dark-800 rounded-xl px-4 py-3.5">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Job title or keyword"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-dark-800 rounded-xl px-4 py-3.5 sm:w-44">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City or remote"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6 py-3.5 whitespace-nowrap">
                Search Jobs
              </button>
            </motion.form>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 text-xs text-gray-500">
              <span className="text-gray-600">Popular:</span>
              {['React Developer', 'Product Manager', 'Data Analyst', 'UX Designer'].map(t => (
                <button key={t} onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(t)}`)}
                  className="text-gray-400 hover:text-primary-400 transition-colors">
                  {t}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto text-center">
            {[
              { value: statsData?.totalJobs?.toLocaleString()      || '—', label: 'Open Roles' },
              { value: statsData?.totalCompanies?.toLocaleString() || '—', label: 'Companies' },
              { value: statsData?.totalUsers?.toLocaleString()     || '—', label: 'Job Seekers' },
              { value: statsData?.totalApplications?.toLocaleString() || '—', label: 'Applications' },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-display text-3xl font-bold text-white tabular-nums">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Job Categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-white dark:bg-dark-900">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">Explore</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
              </div>
              <Link to="/jobs" className="text-sm text-primary-600 hover:underline hidden md:flex items-center gap-1">
                All jobs <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat, i) => (
                <motion.div key={cat._id || i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/jobs?category=${cat._id || cat.name || cat.title}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all group text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase size={18} className="text-primary-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{cat.name || cat.title}</p>
                    {cat.catTitle || cat.name || cat.title}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Live Jobs ─────────────────────────────────────────────────── */}
      {displayJobs.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-dark-950">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">
                  {featuredJobs.length > 0 ? 'Featured' : 'Latest'}
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {featuredJobs.length > 0 ? 'Featured Jobs' : 'Recently Posted'}
                </h2>
              </div>
              <Link to="/jobs" className="btn-outline btn-sm hidden md:flex">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayJobs.map((job, i) => <JobCard key={job._id} job={job} index={i} />)}
            </div>

            <div className="text-center mt-8 md:hidden">
              <Link to="/jobs" className="btn-outline">Browse all jobs</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Top Companies ─────────────────────────────────────────────── */}
      {featuredCompanies.length > 0 && (
        <section className="py-16 bg-white dark:bg-dark-900">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">Employers</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Companies Hiring Now</h2>
              </div>
              <Link to="/companies" className="text-sm text-primary-600 hover:underline hidden md:flex items-center gap-1">
                All companies <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredCompanies.map((company, i) => (
                <motion.div key={company._id}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/companies/${company.slug || company._id}`}
                    className="card p-5 flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow group">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {company.logo?.secureUrl
                        ? <img src={company.logo.secureUrl} alt={company.name} className="w-full h-full object-cover" />
                        : <Building2 size={24} className="text-gray-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                        {company.name}
                      </p>
                      {company.city && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                          <MapPin size={10} /> {company.city}
                        </p>
                      )}
                      {company.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-1">
                          <CheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why JobPortal ─────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-dark-950">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">Why us</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Everything in one place
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-6">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-primary-600" />
                </div>
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-dark-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-14 md:px-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                Ready to find your next role?
              </h2>
              <p className="text-primary-200 mb-8">
                Create a free account and start applying in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register?role=jobseeker"
                  className="bg-white text-primary-700 font-semibold px-7 py-3 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm">
                  I'm looking for work
                </Link>
                <Link to="/register?role=employer"
                  className="bg-white/15 border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/25 transition-all text-sm">
                  I'm hiring
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function JobCard({ job, index }) {
  const timeAgo = (date) => {
    if (!date) return ''
    const d = Math.floor((Date.now() - new Date(date)) / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return '1d ago'
    if (d < 30) return `${d}d ago`
    return `${Math.floor(d / 30)}mo ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
      <Link to={`/jobs/${job.slug || job._id}`}
        className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group block h-full">

        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.companyId?.logo?.secureUrl
              ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
              : <Building2 size={18} className="text-gray-400" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{job.companyId?.name || job.company}</p>
          </div>
          {job.isUrgent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0 self-start">
              Urgent
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.city && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300">
              <MapPin size={9} /> {job.city}
            </span>
          )}
          {job.workplaceType && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 capitalize">
              {job.workplaceType}
            </span>
          )}
          {job.jobType?.name && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300">
              {job.jobType.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-dark-700">
          {job.salaryMin ? (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ${job.salaryMin?.toLocaleString()} – ${job.salaryMax?.toLocaleString()}
            </p>
          ) : (
            <span className="text-xs text-gray-400">Salary not listed</span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={10} /> {timeAgo(job.createdAt)}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}