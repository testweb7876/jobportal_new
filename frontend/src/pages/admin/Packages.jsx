import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, Package, CheckCircle, X, DollarSign, Crown, Zap } from 'lucide-react'
import api from '@/services/api'
import { Modal, Table, Badge, EmptyState } from '@/components/common/UI'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

// ── API helpers ───────────────────────────────────────────────────────────────
const packagesAdminAPI = {
  getAll: ()          => api.get('/packages'),
  create: (data)      => api.post('/packages', data),
  update: (id, data)  => api.patch(`/packages/${id}`, data),
  deactivate: (id)    => api.delete(`/packages/${id}`),
}

// ── Default form values ────────────────────────────────────────────────────────
const DEFAULT_VALUES = {
  title:              '',
  packageFor:         'employer',
  price:              0,
  isFree:             false,
  packageTime:        30,
  packageTimeUnit:    'days',
  job:                0,
  featuredJob:        0,
  resume:             0,
  featuredResume:     0,
  companies:          1,
  department:         0,
  coverletter:        0,
  jobSearch:          0,
  resumeSearch:       0,
  jobAlert:           0,
  jobApply:           0,
  resumeContactDetail:  0,
  companyContactDetail: 0,
  jobTime:            30,
  jobTimeUnit:        'days',
  status:             true,
}

const PACKAGE_ICONS = [Package, Zap, Crown]
const PACKAGE_COLORS = [
  'from-slate-400 to-slate-600',
  'from-primary-500 to-primary-700',
  'from-amber-400 to-amber-600',
]

export default function AdminPackagesPage() {
  const qc = useQueryClient()
  const [modal, setModal]         = useState(null)   // 'create' | 'edit' | null
  const [editPkg, setEditPkg]     = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [roleTab, setRoleTab]     = useState('employer')

  // ── Fetch packages ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn:  () => packagesAdminAPI.getAll().then(r => r.data?.packages || []),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: DEFAULT_VALUES,
  })

  const isFree    = watch('isFree')
  const pkgFor    = watch('packageFor')
  const isSeeking = pkgFor === 'jobseeker'

  // ── Create mutation ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => packagesAdminAPI.create(data),
    onSuccess: () => {
      toast.success('Package created!')
      setModal(null)
      reset(DEFAULT_VALUES)
      qc.invalidateQueries(['admin-packages'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Create failed'),
  })

  // ── Update mutation ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => packagesAdminAPI.update(id, data),
    onSuccess: () => {
      toast.success('Package updated!')
      setModal(null)
      setEditPkg(null)
      reset(DEFAULT_VALUES)
      qc.invalidateQueries(['admin-packages'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  })

  // ── Deactivate mutation ─────────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id) => packagesAdminAPI.deactivate(id),
    onSuccess: () => {
      toast.success('Package deactivated')
      setDeleteModal(null)
      qc.invalidateQueries(['admin-packages'])
    },
    onError: () => toast.error('Failed to deactivate'),
  })

  // ── Open edit modal ─────────────────────────────────────────────────────────
  const openEdit = (pkg) => {
    setEditPkg(pkg)
    reset({
      title:                pkg.title,
      packageFor:           pkg.packageFor,
      price:                pkg.price || 0,
      isFree:               pkg.isFree || false,
      packageTime:          pkg.packageTime,
      packageTimeUnit:      pkg.packageTimeUnit,
      job:                  pkg.job,
      featuredJob:          pkg.featuredJob,
      resume:               pkg.resume,
      featuredResume:       pkg.featuredResume,
      companies:            pkg.companies,
      department:           pkg.department,
      coverletter:          pkg.coverletter,
      jobSearch:            pkg.jobSearch,
      resumeSearch:         pkg.resumeSearch,
      jobAlert:             pkg.jobAlert,
      jobApply:             pkg.jobApply,
      resumeContactDetail:  pkg.resumeContactDetail,
      companyContactDetail: pkg.companyContactDetail,
      jobTime:              pkg.jobTime,
      jobTimeUnit:          pkg.jobTimeUnit,
      status:               pkg.status,
    })
    setModal('edit')
  }

  // ── Open create modal ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditPkg(null)
    reset(DEFAULT_VALUES)
    setModal('create')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = (data) => {
    const payload = {
      ...data,
      price:       data.isFree ? 0 : Number(data.price),
      packageTime: Number(data.packageTime),
      jobTime:     Number(data.jobTime),
      job:         Number(data.job),
      featuredJob: Number(data.featuredJob),
      resume:      Number(data.resume),
      featuredResume:       Number(data.featuredResume),
      companies:            Number(data.companies),
      department:           Number(data.department),
      coverletter:          Number(data.coverletter),
      jobSearch:            Number(data.jobSearch),
      resumeSearch:         Number(data.resumeSearch),
      jobAlert:             Number(data.jobAlert),
      jobApply:             Number(data.jobApply),
      resumeContactDetail:  Number(data.resumeContactDetail),
      companyContactDetail: Number(data.companyContactDetail),
    }
    if (modal === 'edit' && editPkg) {
      updateMutation.mutate({ id: editPkg._id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const allPackages  = data || []
  const filtered     = allPackages.filter(p => p.packageFor === roleTab || p.packageFor === 'both')
  const isPending    = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Package Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage subscription packages</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Package
        </button>
      </div>

      {/* ── Role Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {['employer', 'jobseeker', 'both'].map(role => (
          <button key={role} onClick={() => setRoleTab(role)}
            className={clsx(
              'px-5 py-2 rounded-full text-sm font-semibold capitalize transition-colors',
              roleTab === role
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
            )}>
            {role === 'both' ? 'Both Roles' : role}
          </button>
        ))}
      </div>

      {/* ── Package Cards ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-6 h-80 animate-pulse bg-gray-100 dark:bg-dark-800 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package}
          title="No packages yet"
          description={`No packages found for ${roleTab}s. Create one to get started.`}
          action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Create Package</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((pkg, i) => {
            const Icon  = PACKAGE_ICONS[i % 3]
            const grad  = PACKAGE_COLORS[i % 3]
            return (
              <div key={pkg._id} className={clsx('card p-6 relative', !pkg.status && 'opacity-60')}>
                {!pkg.status && (
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-danger text-xs">Deactivated</span>
                  </div>
                )}

                {/* Icon + Title */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-4`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {pkg.title}
                </h3>
                <span className="badge badge-gray capitalize text-xs mb-3 inline-block">{pkg.packageFor}</span>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-4">
                  {pkg.isFree ? (
                    <span className="text-2xl font-bold text-emerald-600">Free</span>
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

                {/* Feature Summary */}
                <div className="space-y-1.5 mb-5 text-sm">
                  {pkg.packageFor !== 'jobseeker' && (
                    <>
                      {pkg.job > 0       && <FeatureRow label="Job Posts"         value={pkg.job} />}
                      {pkg.featuredJob > 0 && <FeatureRow label="Featured Jobs"   value={pkg.featuredJob} />}
                      {pkg.resumeSearch > 0 && <FeatureRow label="Resume Searches" value={pkg.resumeSearch} />}
                      {pkg.companies > 0 && <FeatureRow label="Company Profiles"  value={pkg.companies} />}
                    </>
                  )}
                  {pkg.packageFor !== 'employer' && (
                    <>
                      {pkg.resume > 0    && <FeatureRow label="Resumes"           value={pkg.resume} />}
                      {pkg.jobApply > 0  && <FeatureRow label="Applications"      value={pkg.jobApply} />}
                      {pkg.jobAlert > 0  && <FeatureRow label="Job Alerts"        value={pkg.jobAlert} />}
                      {pkg.jobSearch > 0 && <FeatureRow label="Job Searches"      value={pkg.jobSearch} />}
                    </>
                  )}
                  <FeatureRow label="Job Duration" value={`${pkg.jobTime} ${pkg.jobTimeUnit}`} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <button onClick={() => openEdit(pkg)} className="btn-secondary flex-1 btn-sm justify-center">
                    <Edit2 size={13} /> Edit
                  </button>
                  {pkg.status && (
                    <button onClick={() => setDeleteModal(pkg)}
                      className="btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => { setModal(null); setEditPkg(null); reset(DEFAULT_VALUES) }}
        title={modal === 'edit' ? `Edit Package — ${editPkg?.title}` : 'Create New Package'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Package Name *</label>
              <input
                {...register('title', { required: 'Package name is required' })}
                placeholder="e.g. Starter, Professional, Enterprise"
                className={`input ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Package For *</label>
              <select {...register('packageFor')} className="input">
                <option value="employer">Employer</option>
                <option value="jobseeker">Job Seeker</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="label">Duration</label>
              <div className="flex gap-2">
                <input
                  {...register('packageTime', { required: true, min: 1 })}
                  type="number" min="1"
                  className="input w-24"
                  placeholder="30"
                />
                <select {...register('packageTimeUnit')} className="input flex-1">
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-xl space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pricing</h3>
            <div className="flex items-center gap-3">
              <input
                {...register('isFree')}
                type="checkbox" id="isFree"
                className="w-4 h-4 rounded text-primary-600"
              />
              <label htmlFor="isFree" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                This is a <strong>free</strong> package
              </label>
            </div>
            {!isFree && (
              <div>
                <label className="label">Price (USD) *</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('price', { required: !isFree, min: { value: 1, message: 'Min $1' } })}
                    type="number" min="0" step="0.01"
                    placeholder="49.99"
                    className={`input pl-9 ${errors.price ? 'input-error' : ''}`}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
              </div>
            )}
          </div>

          {/* Employer Features */}
          {(pkgFor === 'employer' || pkgFor === 'both') && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-3 flex items-center gap-2">
                <span className="badge badge-primary text-xs">Employer</span> Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'job',                  label: 'Job Posts' },
                  { name: 'featuredJob',           label: 'Featured Jobs' },
                  { name: 'companies',             label: 'Company Profiles' },
                  { name: 'department',            label: 'Departments' },
                  { name: 'resumeSearch',          label: 'Resume Searches' },
                  { name: 'companyContactDetail',  label: 'Contact Detail Views' },
                ].map(({ name, label }) => (
                  <FeatureInput key={name} name={name} label={label} register={register} />
                ))}
              </div>
              <div className="mt-3">
                <label className="label text-xs">Job Listing Duration</label>
                <div className="flex gap-2">
                  <input
                    {...register('jobTime', { min: 1 })}
                    type="number" min="1"
                    className="input w-24"
                    placeholder="30"
                  />
                  <select {...register('jobTimeUnit')} className="input flex-1">
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Jobseeker Features */}
          {(pkgFor === 'jobseeker' || pkgFor === 'both') && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm mb-3 flex items-center gap-2">
                <span className="badge badge-success text-xs">Job Seeker</span> Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'resume',               label: 'Resumes' },
                  { name: 'featuredResume',        label: 'Featured Resumes' },
                  { name: 'jobApply',              label: 'Applications' },
                  { name: 'jobAlert',              label: 'Job Alerts' },
                  { name: 'jobSearch',             label: 'Job Searches' },
                  { name: 'coverletter',           label: 'Cover Letters' },
                  { name: 'resumeContactDetail',   label: 'Contact Detail Views' },
                ].map(({ name, label }) => (
                  <FeatureInput key={name} name={name} label={label} register={register} />
                ))}
              </div>
            </div>
          )}

          {/* Status (edit only) */}
          {modal === 'edit' && (
            <div className="flex items-center gap-3">
              <input
                {...register('status')}
                type="checkbox"
                id="pkgStatus"
                className="w-4 h-4 rounded text-primary-600"
              />
              <label htmlFor="pkgStatus" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                Package is <strong>active</strong> (visible to users)
              </label>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
            <button
              type="button"
              onClick={() => { setModal(null); setEditPkg(null); reset(DEFAULT_VALUES) }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending
                ? 'Saving...'
                : modal === 'edit' ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Deactivate Confirm Modal ──────────────────────────────────── */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Deactivate Package"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to deactivate{' '}
            <strong>"{deleteModal?.title}"</strong>?{' '}
            Users with active subscriptions will keep access until expiry.
            New purchases will be disabled.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => deactivateMutation.mutate(deleteModal._id)}
              disabled={deactivateMutation.isPending}
              className="btn-danger flex-1"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Helper sub-components ─────────────────────────────────────────────────────
function FeatureRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
        {label}
      </span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function FeatureInput({ name, label, register }) {
  return (
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">{label}</label>
      <input
        {...register(name, { min: 0 })}
        type="number"
        min="0"
        className="input h-9 text-sm"
        placeholder="0"
      />
    </div>
  )
}
