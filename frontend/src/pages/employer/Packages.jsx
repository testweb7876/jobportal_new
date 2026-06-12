import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, Crown, Zap, Package, CreditCard, Building2, Upload, RefreshCw } from 'lucide-react'
import api, { packageAPI, paymentAPI } from '@/services/api'
import { Badge, Modal, Skeleton } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { settingsAPI } from '@/services/api'

export default function EmpPackages() {
  const { user } = useAuthStore()
  const [payModal, setPayModal] = useState(null)
  const [payMethod, setPayMethod] = useState('stripe')
  const fileRef = useRef()
  const [bankPkg, setBankPkg] = useState(null)

  const { data: packagesData, isLoading: pkgsLoading } = useQuery({
    queryKey: ['packages-employer'],
    queryFn: () => packageAPI.getAll({ for: 'employer' }).then(r => r.data?.packages || []),
  })

  const { data: bankDetails } = useQuery({
    queryKey: ['bank-details'],
    queryFn: () => settingsAPI.getBankDetails(),
  })
  const bank = bankDetails?.data?.bank

  const qc = useQueryClient()

  const { data: historyData } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payments/history').then(r => r.data?.data || []),
  })

  const paypalOrderMutation = useMutation({
    mutationFn: (packageId) => paymentAPI.createPaypalOrder({ packageId }),
    onError: () => toast.error('PayPal order failed'),
  })

  const paypalCaptureMutation = useMutation({
    mutationFn: (orderId) => paymentAPI.capturePaypal({ orderId }),
    onSuccess: () => {
      toast.success('Payment successful! 🎉')
      setPayModal(null)
      qc.invalidateQueries(['my-package'])
    },
    onError: () => toast.error('PayPal capture failed'),
  })

  const bankMutation = useMutation({
    mutationFn: (formData) => paymentAPI.submitBankProof(formData),

    onSuccess: () => {
      toast.success('Proof submitted! Admin will review shortly.')
      setPayModal(null)
      setBankPkg(null)
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || 'Submission failed')
    },
  })

  const refundMutation = useMutation({
    mutationFn: (invoiceId) => paymentAPI.requestRefund(invoiceId),
    onSuccess: () => toast.success('Refund requested!'),
    onError: () => toast.error('Refund request failed'),
  })

  const { data: myPkgData } = useQuery({
    queryKey: ['my-package'],
    queryFn: () => packageAPI.getMyPackage().then(r => r.data?.package),
  })

  const stripeMutation = useMutation({
    mutationFn: (packageId) => paymentAPI.createStripeSession({ packageId }),
    onSuccess: (res) => { window.location.href = res.data.sessionUrl },
    onError: () => toast.error('Failed to create payment session'),
  })

  const freeMutation = useMutation({
    mutationFn: (packageId) => paymentAPI.activateFree({ packageId }),
    onSuccess: () => { toast.success('Free package activated! 🎉'); setPayModal(null) },
    onError: (err) => toast.error(err.response?.data?.message || 'Activation failed'),
  })

  const handlePay = async (pkg) => {
    if (pkg.isFree) { freeMutation.mutate(pkg._id); return }
    if (payMethod === 'stripe') { stripeMutation.mutate(pkg._id); return }
    if (payMethod === 'bank') { setBankPkg(pkg); setPayModal(null); return }
    if (payMethod === 'paypal') {
      const res = await paypalOrderMutation.mutateAsync(pkg._id)
      const orderId = res.data?.orderId || res.data?.data?.orderId
      if (!orderId) return toast.error('Could not create PayPal order')
      // Open PayPal in new tab — after approval user comes back and we capture
      const popup = window.open(
        `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
        '_blank', 'width=600,height=700'
      )
      // Poll for popup close then capture
      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer)
          paypalCaptureMutation.mutate(orderId)
        }
      }, 1000)
    }
  }

  const packages = packagesData || []
  const history = historyData || []
  const myPkg = myPkgData

  const icons = [Package, Zap, Crown]
  const gradients = [
    'from-gray-500 to-gray-700',
    'from-primary-500 to-primary-700',
    'from-amber-500 to-amber-700',
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Packages & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400">Choose the right plan for your hiring needs</p>
      </div>

      {/* Current Package */}
      {myPkg && (
        <div className="card p-6 border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-primary-600" />
                <h2 className="font-display font-bold text-gray-900 dark:text-white">Active Package</h2>
              </div>
              <p className="text-xl font-bold text-primary-600 mb-3">{myPkg.packageId?.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expires: <strong>{format(new Date(myPkg.endDate), 'MMM dd, yyyy')}</strong>
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-primary-200 dark:border-primary-700">
            {[
              { label: 'Jobs Remaining', value: myPkg.remainingJobs },
              { label: 'Featured Jobs', value: myPkg.remainingFeaturedJobs },
              { label: 'Resume Searches', value: myPkg.remainingResumeSearch },
              { label: 'Applications', value: myPkg.remainingJobApply },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-display font-bold text-primary-600">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {pkgsLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg, i) => {
            const Icon = icons[i] || Package
            const isPopular = i === 1
            const isCurrent = myPkg?.packageId?._id === pkg._id || myPkg?.packageId === pkg._id

            return (
              <motion.div key={pkg._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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

                <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br mb-4', gradients[i] || gradients[0])}>
                  <Icon size={22} className="text-white" />
                </div>

                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-1">{pkg.title}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  {pkg.isFree ? (
                    <span className="text-3xl font-display font-bold text-emerald-600">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">${pkg.price}</span>
                      <span className="text-gray-400 text-sm">/ {pkg.packageTime} {pkg.packageTimeUnit}</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    { label: `${pkg.job} Job Posts`, enabled: pkg.job > 0 },
                    { label: `${pkg.featuredJob} Featured Jobs`, enabled: pkg.featuredJob > 0 },
                    { label: `${pkg.resumeSearch} Resume Searches`, enabled: pkg.resumeSearch > 0 },
                    { label: `${pkg.department} Departments`, enabled: pkg.department > 0 },
                    { label: `${pkg.jobTime} Days Job Duration`, enabled: true },
                    { label: 'Analytics Dashboard', enabled: !pkg.isFree },
                    { label: 'Priority Support', enabled: i === 2 },
                  ].map(({ label, enabled }) => (
                    <li key={label} className={clsx('flex items-center gap-2.5 text-sm', enabled ? 'text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600 line-through')}>
                      <CheckCircle size={15} className={enabled ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'} />
                      {label}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="btn-secondary w-full justify-center opacity-60">Current Plan</button>
                ) : (
                  <button onClick={() => setPayModal(pkg)}
                    className={clsx('w-full justify-center', isPopular ? 'btn-primary' : 'btn-outline')}>
                    {pkg.isFree ? 'Activate Free' : 'Get Started'}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

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
                  {inv.paymentStatus === 'paid' && (
                    <button
                      onClick={() => {
                        if (confirm('Request a refund for this payment?'))
                          refundMutation.mutate(inv._id)
                      }}
                      disabled={refundMutation.isPending}
                      className="text-xs text-red-500 hover:underline mt-1 block">
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Upgrade to ${payModal?.title}`}>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">{payModal?.title}</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {payModal?.isFree ? 'Free' : `$${payModal?.price}`}
              </span>
            </div>
            <p className="text-xs text-gray-400">{payModal?.packageTime} {payModal?.packageTimeUnit} · {payModal?.job} job posts</p>
          </div>

          {!payModal?.isFree && (
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'stripe', label: 'Credit / Debit Card', icon: CreditCard },
                  { value: 'paypal', label: 'PayPal',               icon: Building2 },
                  { value: 'bank',   label: 'Bank Transfer',        icon: Upload },
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
            <button onClick={() => setPayModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => handlePay(payModal)}
              disabled={stripeMutation.isPending || freeMutation.isPending}
              className="btn-primary flex-1">
              {stripeMutation.isPending || freeMutation.isPending
                ? 'Processing...'
                : payModal?.isFree ? 'Activate Now' : `Pay $${payModal?.price}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bank Transfer Modal */}
      <Modal open={!!bankPkg} onClose={() => setBankPkg(null)} title="Bank Transfer Payment" size="sm">
        <div className="space-y-4">

          {/* Package summary */}
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">{bankPkg?.title}</span>
              <span className="font-bold text-gray-900 dark:text-white">${bankPkg?.price}</span>
            </div>
          </div>

          {/* Bank details */}
          {bank ? (
            <div className="p-4 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl space-y-2">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3">
                Transfer to this account
              </p>
              {[
                { label: 'Bank',           value: bank.bankName },
                { label: 'Account Name',   value: bank.accountName },
                { label: 'Account Number', value: bank.accountNumber },
                { label: 'IFSC',           value: bank.ifsc },
                { label: 'Branch',         value: bank.branch },
                { label: 'UPI ID',         value: bank.upiId },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              Bank details not configured yet. Contact support.
            </div>
          )}

          {/* Upload proof */}
          <div>
            <label className="label">Upload Transfer Proof (Image/PDF)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="input text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file || !bankPkg) return
                const formData = new FormData()
                formData.append('proof', file)
                formData.append('packageId', bankPkg._id)
                bankMutation.mutate(formData)
              }}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setBankPkg(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              disabled={bankMutation.isPending}
              onClick={() => fileRef.current?.click()}
              className="btn-primary flex-1">
              {bankMutation.isPending ? 'Uploading...' : 'Submit Proof'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
