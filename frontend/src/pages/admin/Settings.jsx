import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { adminAPI, settingsAPI } from '@/services/api'
import { AlertCircle, Activity, Landmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import AccountSecuritySection from '@/components/common/AccountSecuritySection'

export default function AdminSettings() {
  const qc = useQueryClient()

  // ── Bank Details ─────────────────────────────────────────────────────────
  const { data: bankData } = useQuery({
    queryKey: ['bank-details'],
    queryFn: () => settingsAPI.getBankDetails(),
  })

  const { register: regBank, handleSubmit: handleBank, reset: resetBank } = useForm()

  useEffect(() => {
    const bank = bankData?.data?.bank
    if (bank) resetBank(bank)
  }, [bankData])

  const bankMutation = useMutation({
    mutationFn: (data) => settingsAPI.updateBankDetails(data),
    onSuccess: () => {
      toast.success('Bank details saved!')
      qc.invalidateQueries({ queryKey: ['bank-details'] })
    },
    onError: () => toast.error('Failed to save'),
  })

  // ── System Errors ─────────────────────────────────────────────────────────
  const { data: errorsData } = useQuery({
    queryKey: ['system-errors'],
    queryFn: () => adminAPI.getSystemErrors().then(r => r.data?.errors || []),
  })
  const errors = errorsData || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Admin Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">System configuration, error logs, and your account security</p>
      </div>

      {/* ── Bank Account Details ─────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Landmark size={16} className="text-primary-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Bank Account Details</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          These details will be shown to users when they select Bank Transfer as payment method.
        </p>
        <form onSubmit={handleBank((d) => bankMutation.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Bank Name</label>
              <input {...regBank('bankName')} className="input" placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label className="label">Account Holder Name</label>
              <input {...regBank('accountName')} className="input" placeholder="e.g. JobPortal Pvt Ltd" />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input {...regBank('accountNumber')} className="input" placeholder="e.g. 1234567890" />
            </div>
            <div>
              <label className="label">IFSC Code</label>
              <input {...regBank('ifsc')} className="input" placeholder="e.g. HDFC0001234" />
            </div>
            <div>
              <label className="label">UPI ID (optional)</label>
              <input {...regBank('upiId')} className="input" placeholder="e.g. jobportal@hdfc" />
            </div>
            <div>
              <label className="label">Branch</label>
              <input {...regBank('branch')} className="input" placeholder="e.g. Connaught Place, Delhi" />
            </div>
          </div>
          <button type="submit" disabled={bankMutation.isPending} className="btn-primary">
            {bankMutation.isPending ? 'Saving...' : 'Save Bank Details'}
          </button>
        </form>
      </div>

      {/* ── System Error Logs ────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">System Error Logs</h2>
        </div>
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <Activity size={16} />
            <span className="text-sm font-medium">No system errors. Everything running smoothly! ✅</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errors.map(err => (
              <div key={err._id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-600">Error</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(err.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">{err.error}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Account Security (password, sessions, logout-all) ─────────────── */}
      <AccountSecuritySection />
    </div>
  )
}