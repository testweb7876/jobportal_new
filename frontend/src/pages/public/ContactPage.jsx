import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Mail, Clock, Globe2, Send, CheckCircle2,
  MessageCircle, Briefcase, HelpCircle,
} from 'lucide-react'
import api from '@/services/api'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  category: z.string().min(1, 'Choose a topic'),
  message: z.string().min(20, 'Tell us a bit more — at least 20 characters'),
})

const categories = [
  { value: 'general', label: 'General inquiry' },
  { value: 'jobseeker', label: 'Job seeker support' },
  { value: 'employer', label: 'Employer & recruiting' },
  { value: 'partnership', label: 'Partnerships & press' },
  { value: 'issue', label: 'Report an issue' },
]

const contactInfo = [
  { icon: Mail, title: 'Email us', detail: 'support@jobportal.com' },
  { icon: Clock, title: 'Response time', detail: 'Within 24 hours, Mon–Fri' },
  { icon: Globe2, title: 'Where we are', detail: 'Remote-first, team across 12 countries' },
]

const faqs = [
  { q: 'How do I reset my password?', a: 'Go to the login page and select "Forgot password" — we\'ll email you a secure reset link.' },
  { q: 'How long does job verification take?', a: 'Company and listing verification is usually completed within 1–2 business days.' },
  { q: 'Can I edit a job after posting it?', a: 'Yes, employers can edit any active listing from Employer Dashboard → Jobs at any time.' },
  { q: 'Do you offer a free plan for employers?', a: 'Yes, a limited free tier is available — check Employer → Packages for full pricing.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/contact', data),
    onSuccess: () => {
      toast.success("Message sent — we'll get back to you soon.")
      // Note: don't call reset() here — RHF's reset() also clears isSubmitSuccessful,
      // and we no longer depend on that flag anyway. Form is reset when the user
      // explicitly asks to send another message (see button below).
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  const handleSendAnother = () => {
    mutation.reset()
    reset()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-30 pointer-events-none" />
        <div className="container-custom relative max-w-2xl text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="badge-primary mb-6">Get in touch</span>
            <h1 className="page-title mb-4">We read every message</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Question about an application, a listing, or partnering with us? Tell us what's up
              and a real person on our team will reply.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Form + Info ──────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3 card p-6 md:p-8"
            >
              {mutation.isSuccess ? (
                <div className="flex flex-col items-center text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 size={26} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Message sent
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Thanks for reaching out — we typically reply within 24 hours on weekdays.
                  </p>
                  <button type="button" onClick={handleSendAnother} className="btn-ghost mt-6 text-sm" >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label" htmlFor="name">Full name</label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Jordan Lee"
                        className={errors.name ? 'input-error' : 'input'}
                        {...register('name')}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={errors.email ? 'input-error' : 'input'}
                        {...register('email')}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="category">Topic</label>
                    <select
                      id="category"
                      defaultValue=""
                      className={errors.category ? 'input-error' : 'input'}
                      {...register('category')}
                    >
                      <option value="" disabled>Choose a topic</option>
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-xs text-red-500 mt-1.5">{errors.category.message}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us what's going on..."
                      className={errors.message ? 'input-error resize-none' : 'input resize-none'}
                      {...register('message')}
                    />
                    {errors.message && <p className="text-xs text-red-500 mt-1.5">{errors.message.message}</p>}
                  </div>

                  <button type="submit" disabled={mutation.isPending} className="btn-primary w-full sm:w-auto">
                    {mutation.isPending ? 'Sending...' : <>Send message <Send size={15} /></>}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Info sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              {contactInfo.map((item) => (
                <div key={item.title} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}

              <div className="card p-5 bg-primary-600 border-none">
                <MessageCircle size={20} className="text-white/80 mb-3" />
                <p className="text-sm font-semibold text-white mb-1">Hiring at scale?</p>
                <p className="text-sm text-primary-100 mb-4">
                  Talk to our team about employer plans built for high-volume hiring.
                </p>
                <a href="mailto:sales@jobportal.com" className="btn bg-white text-primary-700 hover:bg-gray-50 text-xs px-4 py-2">
                  <Briefcase size={14} /> Talk to sales
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="container-custom max-w-2xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <span className="badge-gray mb-4">
              <HelpCircle size={12} /> Before you write in
            </span>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              Quick answers
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="card p-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-white">
                  {item.q}
                  <span className="text-gray-400 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}