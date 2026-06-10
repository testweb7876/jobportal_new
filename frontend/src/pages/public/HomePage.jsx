import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase, Building2, Users, TrendingUp, ArrowRight, CheckCircle, Star, Zap, Globe, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { jobsAPI, companyAPI } from '@/services/api'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

const stats = [
  { icon: Briefcase, value: '50,000+', label: 'Active Jobs' },
  { icon: Building2, value: '10,000+', label: 'Companies' },
  { icon: Users, value: '500,000+', label: 'Job Seekers' },
  { icon: TrendingUp, value: '95%', label: 'Success Rate' },
]

const categories = [
  { icon: '💻', label: 'Technology', count: '12,430' },
  { icon: '💊', label: 'Healthcare', count: '8,210' },
  { icon: '📊', label: 'Finance', count: '6,540' },
  { icon: '🎨', label: 'Design', count: '4,890' },
  { icon: '📱', label: 'Marketing', count: '5,670' },
  { icon: '🏗️', label: 'Engineering', count: '9,120' },
  { icon: '📚', label: 'Education', count: '3,450' },
  { icon: '⚖️', label: 'Legal', count: '2,180' },
]

const features = [
  { icon: Zap, title: 'AI-Powered Matching', desc: 'Our AI engine matches your skills to the best opportunities instantly.' },
  { icon: Globe, title: 'Remote-First', desc: 'Access thousands of remote, hybrid, and onsite positions worldwide.' },
  { icon: Shield, title: 'Verified Companies', desc: 'Every employer is verified so you can apply with confidence.' },
]

export default function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const { data: featuredJobs } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: () => jobsAPI.getFeatured().then(r => r.data?.jobs || []),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?keyword=${keyword}&city=${location}`)
  }

  return (
    <div className="overflow-hidden">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="container-custom relative z-10 py-20 md:py-32">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">

            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 border border-primary-500/30 text-primary-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              50,000+ jobs added this month
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Find Your{' '}
              <span className="relative">
                <span className="gradient-text">Dream Career</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                  <path d="M0 6 Q100 0 200 6 Q300 12 400 6" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                </svg>
              </span>
              <br />Starts Here
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Connect with top companies hiring right now. Upload your resume, set alerts, and land interviews faster.
            </motion.p>

            {/* Search Bar */}
            <motion.form variants={fadeUp} onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-3 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-glow-lg max-w-3xl mx-auto">
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-dark-800 rounded-xl px-4 py-3">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input value={keyword} onChange={e => setKeyword(e.target.value)}
                  placeholder="Job title, keywords, or company..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-dark-800 rounded-xl px-4 py-3 md:w-52">
                <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or remote..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" />
              </div>
              <button type="submit" className="btn-primary btn-lg whitespace-nowrap">
                Search Jobs
              </button>
            </motion.form>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-gray-400">
              <span>Popular:</span>
              {['React Developer', 'Product Manager', 'Data Scientist', 'UX Designer'].map(t => (
                <button key={t} onClick={() => navigate(`/jobs?keyword=${t}`)}
                  className="hover:text-primary-400 transition-colors underline underline-offset-2">{t}</button>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="section bg-white dark:bg-dark-900">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <h2 className="page-title mb-3">Browse by Category</h2>
            <p className="text-gray-500 dark:text-gray-400">Explore opportunities across every industry</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={`/jobs?category=${cat.label.toLowerCase()}`}
                  className="card-hover p-6 text-center group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{cat.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{cat.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.count} jobs</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Jobs ─────────────────────────────────────────────────── */}
      {featuredJobs?.length > 0 && (
        <section className="section bg-gray-50 dark:bg-dark-950">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="page-title mb-1">Featured Jobs</h2>
                <p className="text-gray-500 dark:text-gray-400">Hand-picked opportunities from top companies</p>
              </div>
              <Link to="/jobs?featured=true" className="btn-outline hidden md:flex">
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.slice(0, 6).map((job, i) => (
                <JobCard key={job._id} job={job} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section bg-white dark:bg-dark-900">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="page-title mb-3">Why JobPortal?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Everything you need to find your perfect job, all in one place.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-5 group-hover:shadow-glow transition-shadow">
                  <f.icon size={28} className="text-primary-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">Ready to Get Hired?</h2>
              <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">Join 500,000+ professionals who found their dream job on JobPortal.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register?role=jobseeker" className="bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Find a Job
                </Link>
                <Link to="/register?role=employer" className="bg-primary-500/30 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-500/50 transition-all">
                  Hire Talent
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
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
      <Link to={`/jobs/${job.slug || job._id}`} className="card-hover p-5 block group">
        <div className="flex gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.companyId?.logo?.secureUrl
              ? <img src={job.companyId.logo.secureUrl} alt="" className="w-full h-full object-cover" />
              : <Building2 size={20} className="text-gray-400" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 transition-colors truncate">{job.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.companyId?.name || job.company}</p>
          </div>
          {job.isUrgent && <span className="badge badge-danger ml-auto flex-shrink-0">Urgent</span>}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {job.city && <span className="badge badge-gray"><MapPin size={10} />{job.city}</span>}
          {job.workplaceType && <span className="badge badge-primary capitalize">{job.workplaceType}</span>}
        </div>
        {job.salaryMin && (
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}/yr
          </p>
        )}
      </Link>
    </motion.div>
  )
}
