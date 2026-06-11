import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, Crown, Zap, Package, CreditCard, Building2, ArrowRight, Clock } from 'lucide-react'
import api from '@/services/api'
import { packageAPI, paymentAPI } from '@/services/api'
import { Badge, Modal, Skeleton } from '@/components/common/UI'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const PACKAGE_ICONS  = [Package, Zap, Crown]
const PACKAGE_COLORS = [
  'from-slate-400 to-slate-600',
  'from-primary-500 to-primary-700',
  'from-amber-400 to-amber-600',
]

export default function JSPackages() {
  const qc = useQueryClient()
  const [payModal, setPayModal] = useState(null)
  const [payMethod, setPayMethod] = useState('stripe')

  // ── My active package ────────────────────────────────────────────────────────
  const { data: myPkgData, isLoading: myPkgLoading } = useQuery({
    queryKey: ['my-package'],
    queryFn:  () => packageAPI.getMyPackage().then(r => r.data?.package),
  })

  // ── All available packages for jobseekers ───────────────────────────────────
  const { data: packagesData, isLoading: pkgsLoading } = useQuery({
    queryKey: ['packages-jobseeker'],
    queryFn:  () => packageAPI.getAll({ for: 'jobseeker' }).then(r => r.data?.packages || []),
  })

  // ── Payment history ──────────────────────────────────────────────────────────
  const { data: historyData } = useQuery({
    queryKey: ['payment-history'],
    queryFn:  () => api.get('/payments/history').then(r => r.data?.data || []),
  })

  // ── Stripe payment ───────────────────────────────────────────────────────────
  const stripeMutation = useMutation({
    mutationFn: (packageId) => paymentAPI.createStripeSession({ packageId }),
    onSuccess:  (res)       => { window.location.href = res.data.sessionUrl },
    onError:    ()          => toast.error('Failed to start payment. Try again.'),
  })

  // ── Free package activation ──────────────────────────────────────────────────
  const freeMutation = useMutation({
    mutationFn: (packageId) => paymentAPI.activateFree({ packageId }),
    onSuccess:  ()          => {
      toast.success('Free package activated! 🎉')
      setPayModal(null)
      qc.invalidateQueries(['my-package'])
    },
    onError:    (err)       => toast.error(err?.response?.data?.message || 'Activation failed'),
  })

  // ── Handle payment click ─────────────────────────────────────────────────────
  const handlePay = (pkg) => {
    if (pkg.isFree) { freeMutation.mutate(pkg._id); return }
    if (payMethod === 'stripe') { stripeMutation.mutate(pkg._id); return }
    toast.info('PayPal and bank transfer: contact support to activate.')
  }

  const packages  = packagesData || []
  const myPkg     = myPkgData
  const history   = historyData  || []
  const isPending = stripeMutation.isPending || freeMutation.isPending

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Packages & Plans</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Unlock more applications, resume uploads, and job alerts
        </p>
      </div>

      {/* ── Active Package ─────────────────────────────────────────────── */}
      {myPkgLoading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : myPkg ? (
        <div className="card p-6 border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-primary-600" />
                <h2 className="font-display font-bold text-gray-900 dark:text-white">
                  Current Plan
                </h2>
              </div>
              <p className="text-xl font-bold text-primary-600">
                {myPkg.packageId?.title || 'Active Package'}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="success">Active</Badge>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 justify-end">
                <Clock size={11} />
                Expires {format(new Date(myPkg.endDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Usage bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-primary-200 dark:border-primary-700">
            {[
              { label: 'Resumes',      used: myPkg.packageId?.resume      - myPkg.remainingResumes,      total: myPkg.packageId?.resume,      remaining: myPkg.remainingResumes },
              { label: 'Applications', used: myPkg.packageId?.jobApply    - myPkg.remainingJobApply,     total: myPkg.packageId?.jobApply,    remaining: myPkg.remainingJobApply },
              { label: 'Job Alerts',   used: myPkg.packageId?.jobAlert    - myPkg.remainingJobAlerts,    total: myPkg.packageId?.jobAlert,    remaining: myPkg.remainingJobAlerts },
              { label: 'Job Searches', used: myPkg.packageId?.jobSearch   - myPkg.remainingResumeSearch, total: myPkg.packageId?.jobSearch,   remaining: myPkg.remainingResumeSearch },
            ].map(({ label, remaining, total }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-semibold text-primary-600">
                    {remaining === -1 || total === 0 ? '∞' : `${remaining}/${total}`}
                  </span>
                </div>
                {total > 0 && remaining !== -1 && (
                  <div className="h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full">
                    <div
                      className="h-1.5 bg-primary-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (remaining / total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* No package warning */
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Package size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              No active package
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Choose a plan below to start applying to jobs, uploading resumes, and setting job alerts.
            </p>
          </div>
        </div>
      )}

      {/* ── Package Cards ──────────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-5">
          Available Plans
        </h2>

        {pkgsLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="card p-10 text-center">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No packages available right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {packages.map((pkg, i) => {
              const Icon       = PACKAGE_ICONS[i % 3]
              const grad       = PACKAGE_COLORS[i % 3]
              const isPopular  = i === 1
              const isCurrent  =
                myPkg?.packageId?._id === pkg._id ||
                myPkg?.packageId      === pkg._id

              return (
                <motion.div key={pkg._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={clsx(
                    'card p-6 flex flex-col relative',
                    isPopular && 'ring-2 ring-primary-500 shadow-glow'
                  )}>

                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">Current Plan</Badge>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-4`}>
                    <Icon size={22} className="text-white" />
                  </div>

                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {pkg.title}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-5">
                    {pkg.isFree ? (
                      <span className="text-3xl font-display font-bold text-emerald-600">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                          ${pkg.price}
                        </span>
                        <span className="text-gray-400 text-sm">
                          / {pkg.packageTime} {pkg.packageTimeUnit}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1 text-sm">
                    {[
                      pkg.resume      > 0 && `${pkg.resume} Resume Uploads`,
                      pkg.jobApply    > 0 && `${pkg.jobApply} Job Applications`,
                      pkg.jobAlert    > 0 && `${pkg.jobAlert} Job Alerts`,
                      pkg.jobSearch   > 0 && `${pkg.jobSearch} Job Searches`,
                      pkg.coverletter > 0 && `${pkg.coverletter} Cover Letters`,
                      `${pkg.packageTime} ${pkg.packageTimeUnit} validity`,
                    ].filter(Boolean).map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-200">
                        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button disabled className="btn-secondary w-full justify-center opacity-60">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => setPayModal(pkg)}
                      className={clsx(
                        'w-full justify-center',
                        isPopular ? 'btn-primary' : 'btn-outline'
                      )}>
                      {pkg.isFree ? 'Activate Free' : 'Get Started'}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Payment History ────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-gray-900 dark:text-white mb-4">
            Payment History
          </h2>
          <div className="space-y-3">
            {history.slice(0, 5).map(inv => (
              <div key={inv._id}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {inv.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(inv.createdAt), 'MMM dd, yyyy')} · {inv.payMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">${inv.amount}</p>
                  <Badge
                    variant={
                      inv.paymentStatus === 'paid'    ? 'success' :
                      inv.paymentStatus === 'pending' ? 'warning' : 'danger'
                    }
                    className="text-xs">
                    {inv.paymentStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`Activate — ${payModal?.title}`}
        size="sm"
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">{payModal?.title}</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {payModal?.isFree ? 'Free' : `$${payModal?.price}`}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {payModal?.packageTime} {payModal?.packageTimeUnit} ·{' '}
              {payModal?.jobApply || 0} applications ·{' '}
              {payModal?.resume || 0} resumes
            </p>
          </div>

          {/* Payment method (only for paid) */}
          {!payModal?.isFree && (
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'stripe', label: 'Credit / Debit Card', icon: CreditCard },
                  { value: 'paypal', label: 'PayPal',               icon: Building2 },
                ].map(m => (
                  <button key={m.value} type="button"
                    onClick={() => setPayMethod(m.value)}
                    className={clsx(
                      'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors',
                      payMethod === m.value
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300'
                    )}>
                    <m.icon size={16} /> {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPayModal(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => handlePay(payModal)}
              disabled={isPending}
              className="btn-primary flex-1">
              {isPending
                ? 'Processing...'
                : payModal?.isFree
                  ? 'Activate Free Plan'
                  : `Pay $${payModal?.price}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}