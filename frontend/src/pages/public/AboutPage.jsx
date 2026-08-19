import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Briefcase, Building2, Users, CheckCircle2, ArrowRight,
  Target, ShieldCheck, Heart, Rocket, TrendingUp, Globe2,
} from 'lucide-react'

const stats = [
  { value: '3,200+', label: 'Hiring companies' },
  { value: '50K+', label: 'Active job seekers' },
  { value: '18K+', label: 'Roles filled' },
  { value: '92%', label: 'Match satisfaction' },
]

const values = [
  {
    icon: Target,
    title: 'Clarity over noise',
    description: 'Real salary ranges, real timelines, real hiring managers. No listings that vanish into a black box.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust, verified',
    description: 'Every company on JobPortal is screened before their first listing goes live — for candidates and recruiters alike.',
  },
  {
    icon: Heart,
    title: 'People, not profiles',
    description: 'Matching looks at skills and goals, not keyword density. A good fit matters more than a fast one.',
  },
  {
    icon: Rocket,
    title: 'Built to move',
    description: 'From first application to signed offer, every step is tracked in one place — for both sides of the table.',
  },
]

const timeline = [
  { year: '2021', title: 'JobPortal starts as a side project', description: 'Two recruiters, tired of dead-end job boards, start building something better in their spare time.' },
  { year: '2022', title: 'First 10,000 candidates', description: 'Word spreads through tech communities. We add verified company profiles and salary transparency.' },
  { year: '2023', title: 'Employers come on board', description: 'Structured job posting, applicant tracking, and messaging launch — hiring becomes a two-way conversation.' },
  { year: '2025', title: 'Smarter matching', description: 'Skills-based matching rolls out across the platform, cutting time-to-hire by a third for our partners.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-30 pointer-events-none" />
        <div className="container-custom relative grid lg:grid-cols-2 gap-16 items-center">

          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="badge-primary mb-6">Our story</span>
            <h1 className="page-title !text-4xl md:!text-5xl mb-6 leading-[1.1]">
              Hiring, the way it should have<br className="hidden md:block" /> always{' '}
              <span className="gradient-text">worked</span>.
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
              JobPortal connects talented professionals with companies that are actually hiring —
              with transparent salaries, real response times, and a process that respects
              everyone's time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs" className="btn-primary btn-lg">
                Browse open roles <ArrowRight size={16} />
              </Link>
              <Link to="/employer/jobs/post" className="btn-outline btn-lg">
                Post a job
              </Link>
            </div>
          </motion.div>

          {/* Signature element: a floating job-card, grounded in the actual product */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="relative h-80 hidden sm:block"
          >
            <div className="absolute top-0 right-4 w-72 card p-5 shadow-card-hover animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">Senior Product Designer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Northwind Studios</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="badge-primary">Remote</span>
                <span className="badge-success">Full-time</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">$120k – $150k</span>
                <span className="flex items-center gap-1 text-gray-400 text-xs">
                  <Users size={13} /> 128 applied
                </span>
              </div>
            </div>

            <div className="absolute bottom-2 left-0 w-56 card p-4 shadow-card-hover animate-float animate-delay-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Application sent</p>
                  <p className="text-xs text-gray-400">Recruiter notified instantly</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="bg-dark-900 py-14">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center md:text-left"
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-custom max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="badge-gray mb-4">Why we exist</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Job hunting broke somewhere along the way
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Listings with no salary. Applications that disappear. Recruiters who never write
              back. We built JobPortal to fix the parts of hiring that stopped serving people —
              so a good application actually leads somewhere, and a good hire doesn't take three
              months to happen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <section className="section bg-gray-50 dark:bg-dark-850">
        <div className="container-custom">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
              What we optimize for
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Four principles that shape every feature we ship.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card-hover p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <value.icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-custom max-w-3xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
              How we got here
            </h2>
          </motion.div>

          <div className="relative border-l border-gray-200 dark:border-dark-700 pl-8 space-y-10">
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative"
              >
                <div className="absolute -left-[calc(2rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-900/30" />
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 tracking-wide">{item.year}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-1 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-primary-600 px-8 py-16 md:px-16 text-center"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="relative">
              <Briefcase size={28} className="text-white/80 mx-auto mb-5" />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                Ready when you are
              </h2>
              <p className="text-primary-100 mb-8 max-w-md mx-auto">
                Whether you're looking for your next role or your next hire, it starts here.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/jobs" className="btn bg-white text-primary-700 hover:bg-gray-50 px-6 py-2.5 text-sm">
                  <Globe2 size={16} /> Find a job
                </Link>
                <Link to="/employer/jobs/post" className="btn bg-primary-700 text-white hover:bg-primary-800 px-6 py-2.5 text-sm">
                  <TrendingUp size={16} /> Hire talent
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}