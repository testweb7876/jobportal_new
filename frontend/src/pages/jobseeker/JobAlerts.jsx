import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Bell, Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/services/api'
import { categoriesAPI } from '@/services/api'
import { EmptyState, Modal, Badge } from '@/components/common/UI'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

// ── API helpers ───────────────────────────────────────────────────────────────
const alertsAPI = {
  getAll:  ()         => api.get('/job-alerts'),
  create:  (data)     => api.post('/job-alerts', data),
  update:  (id, data) => api.patch(`/job-alerts/${id}`, data),
  delete:  (id)       => api.delete(`/job-alerts/${id}`),
  toggle:  (id, status) => api.patch(`/job-alerts/${id}`, { status }),
}

const DEFAULT = {
  name: '', contactEmail: '', categoryId: '', keywords: '',
  city: '', workplaceType: 0, jobType: 0,
}

const WORKPLACE_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: 'On-site' },
  { value: 2, label: 'Remote' },
  { value: 3, label: 'Hybrid' },
]

export default function JSAlerts() {
  const qc = useQueryClient()
  const [modal, setModal]     = useState(false)
  const [editAlert, setEdit]  = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: DEFAULT,
  })

  // ── Fetch alerts ────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['job-alerts'],
    queryFn:  () => alertsAPI.getAll().then(r => r.data?.alerts || r.data?.data || []),
  })

  // ── Fetch categories for filter dropdown ────────────────────────────────────
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesAPI.getCategories().then(r => r.data?.categories || []),
    staleTime: Infinity,
  })

  // ── Create ──────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => alertsAPI.create(data),
    onSuccess: () => {
      toast.success('Job alert created! You\'ll get notified when matching jobs are posted.')
      setModal(false)
      reset(DEFAULT)
      qc.invalidateQueries(['job-alerts'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create alert'),
  })

  // ── Update ──────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => alertsAPI.update(id, data),
    onSuccess: () => {
      toast.success('Alert updated!')
      setModal(false)
      setEdit(null)
      reset(DEFAULT)
      qc.invalidateQueries(['job-alerts'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  })

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => alertsAPI.delete(id),
    onSuccess: () => { toast.success('Alert deleted'); qc.invalidateQueries(['job-alerts']) },
    onError: () => toast.error('Failed to delete'),
  })

  // ── Toggle status ───────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => alertsAPI.toggle(id, status),
    onSuccess: () => qc.invalidateQueries(['job-alerts']),
    onError: () => toast.error('Failed to update'),
  })

  // ── Open edit ───────────────────────────────────────────────────────────────
  const openEdit = (alert) => {
    setEdit(alert)
    reset({
      name:          alert.name,
      contactEmail:  alert.contactEmail,
      categoryId:    alert.categoryId || '',
      keywords:      alert.keywords   || '',
      city:          alert.city       || '',
      workplaceType: alert.workplaceType || 0,
      jobType:       alert.jobType    || 0,
    })
    setModal(true)
  }

  // ── Open create ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEdit(null)
    reset(DEFAULT)
    setModal(true)
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = (data) => {
    const payload = {
      ...data,
      workplaceType: Number(data.workplaceType),
      status: 1,
    }
    if (editAlert) {
      updateMutation.mutate({ id: editAlert._id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const alerts     = data || []
  const categories = categoriesData || []
  const isPending  = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Job Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Get notified when matching jobs are posted
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} /> Create Alert
        </button>
      </div>

      {/* How it works banner */}
      <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 rounded-xl">
        <Bell size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">
            How job alerts work
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
            Set your preferred keywords, category, and location. We'll email you every 6 hours
            when new matching jobs are posted. You can pause or delete alerts anytime.
          </p>
        </div>
      </div>

      {/* Alerts list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-dark-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No job alerts yet"
          description="Create your first alert and we'll notify you when matching jobs are posted."
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus size={15} /> Create Your First Alert
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert._id} className="card p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                  ${alert.status === 1
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'bg-gray-100 dark:bg-dark-700'}`}>
                  <Bell size={18} className={alert.status === 1
                    ? 'text-primary-600'
                    : 'text-gray-400'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{alert.name}</h3>
                    <Badge variant={alert.status === 1 ? 'success' : 'gray'}>
                      {alert.status === 1 ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Sending to: <span className="font-medium">{alert.contactEmail}</span>
                  </p>

                  {/* Filter tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {alert.keywords && (
                      <span className="badge badge-primary text-xs">🔍 {alert.keywords}</span>
                    )}
                    {alert.city && (
                      <span className="badge badge-gray text-xs">📍 {alert.city}</span>
                    )}
                    {alert.workplaceType > 0 && (
                      <span className="badge badge-gray text-xs capitalize">
                        {WORKPLACE_OPTIONS.find(w => w.value === alert.workplaceType)?.label}
                      </span>
                    )}
                    {alert.lastMailSend && (
                      <span className="badge badge-gray text-xs">
                        Last sent {formatDistanceToNow(new Date(alert.lastMailSend), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle active/paused */}
                  <button
                    onClick={() => toggleMutation.mutate({
                      id: alert._id,
                      status: alert.status === 1 ? 0 : 1,
                    })}
                    disabled={toggleMutation.isPending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    title={alert.status === 1 ? 'Pause alert' : 'Resume alert'}>
                    {alert.status === 1
                      ? <ToggleRight size={20} className="text-primary-600" />
                      : <ToggleLeft size={20} className="text-gray-400" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(alert)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 hover:text-primary-600 transition-colors">
                    <Edit2 size={15} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete alert "${alert.name}"?`)) {
                        deleteMutation.mutate(alert._id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setEdit(null); reset(DEFAULT) }}
        title={editAlert ? `Edit Alert — ${editAlert.name}` : 'Create Job Alert'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Alert Name *</label>
            <input
              {...register('name', { required: 'Alert name is required' })}
              placeholder="e.g. React Developer in NYC"
              className={`input ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Notification Email *</label>
            <input
              {...register('contactEmail', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Valid email required' },
              })}
              type="email"
              placeholder="you@example.com"
              className={`input ${errors.contactEmail ? 'input-error' : ''}`}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-xs text-red-500">{errors.contactEmail.message}</p>
            )}
          </div>

          <div>
            <label className="label">Keywords</label>
            <input
              {...register('keywords')}
              placeholder="e.g. react, node.js, remote"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple keywords with commas</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('categoryId')} className="input">
                <option value="">Any Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.catTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Workplace Type</label>
              <select {...register('workplaceType')} className="input">
                {WORKPLACE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">City / Location</label>
            <input
              {...register('city')}
              placeholder="e.g. New York, London (leave empty for any)"
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
            <button
              type="button"
              onClick={() => { setModal(false); setEdit(null); reset(DEFAULT) }}
              className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
              {isPending
                ? 'Saving...'
                : editAlert ? 'Update Alert' : 'Create Alert'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}