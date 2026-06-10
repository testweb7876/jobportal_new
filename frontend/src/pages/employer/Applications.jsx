import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Users, Eye, Star, ChevronDown, Search, Filter, Download } from 'lucide-react'
import { applicationAPI, jobsAPI } from '@/services/api'
import { Avatar, StatusBadge, EmptyState, Pagination, Modal, Table } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_OPTIONS = ['reviewed', 'shortlisted', 'interview_scheduled', 'offered', 'hired', 'rejected']

export default function EmpApplications() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState(null)
  const [statusModal, setStatusModal] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const qc = useQueryClient()

  const jobId = searchParams.get('jobId')

  const { data: myJobsData } = useQuery({
    queryKey: ['my-jobs-select'],
    queryFn: () => jobsAPI.myJobs({ limit: 100 }).then(r => r.data?.data || []),
  })

  const [selectedJobId, setSelectedJobId] = useState(jobId || '')

  const { data, isLoading } = useQuery({
    queryKey: ['job-applications', selectedJobId, { page, status: statusFilter }],
    queryFn: () => applicationAPI.jobApplications(selectedJobId, {
      page, limit: 15,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }).then(r => r.data),
    enabled: !!selectedJobId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }) => applicationAPI.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Application status updated')
      setStatusModal(null)
      setNewStatus('')
      setStatusNote('')
      setInterviewDate('')
      qc.invalidateQueries(['job-applications'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const applications = data?.data || []
  const pagination = data?.pagination || {}
  const myJobs = myJobsData || []

  const handleStatusUpdate = () => {
    if (!newStatus) { toast.error('Please select a status'); return }
    updateStatusMutation.mutate({
      id: statusModal._id,
      data: {
        status: newStatus,
        note: statusNote,
        ...(newStatus === 'interview_scheduled' && { interviewDate, interviewType: 'video' }),
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Applications</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all candidate applications</p>
        </div>
      </div>

      {/* Job Selector */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="label text-xs">Select Job to View Applications</label>
          <select value={selectedJobId} onChange={e => { setSelectedJobId(e.target.value); setPage(1) }}
            className="input h-12 text-sm">
            <option value="">-- Select a Job --</option>
            {myJobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title} ({job.applicationsCount || 0} applications)
              </option>
            ))}
          </select>
        </div>

        {selectedJobId && (
          <div>
            <label className="label text-xs">Filter by Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="input h-12 text-sm w-44">
              <option value="all">All Status</option>
              {['applied', ...STATUS_OPTIONS].map(s => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Applications */}
      {!selectedJobId ? (
        <EmptyState icon={Users} title="Select a job to view applications"
          description="Choose one of your job listings from the dropdown above" />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-12 rounded-full bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState icon={Users} title="No applications yet"
          description="Applications for this job will appear here" />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} applications found</p>
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app._id} className={clsx(
                'card p-5 transition-all',
                selectedApp?._id === app._id && 'ring-2 ring-primary-500'
              )}>
                <div className="flex items-start gap-4">
                  <Avatar name={`${app.uid?.firstName} ${app.uid?.lastName}`}
                    src={app.uid?.avatar?.secureUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {app.uid?.firstName} {app.uid?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{app.uid?.email}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      <span>Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</span>
                      {app.cvId && <span>Resume attached</span>}
                      {app.quickApply && <span className="text-primary-600 font-medium">Quick Apply</span>}
                      {app.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star size={11} className="fill-current" /> {app.rating}/5
                        </span>
                      )}
                    </div>

                    {app.applyMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-dark-800 rounded-lg p-3 line-clamp-2">
                        "{app.applyMessage}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                  {app.cvId && (
                    <button onClick={() => setSelectedApp(app)}
                      className="btn-secondary btn-sm flex items-center gap-1.5">
                      <Eye size={13} /> View Resume
                    </button>
                  )}
                  <button onClick={() => { setStatusModal(app); setNewStatus(app.status) }}
                    className="btn-primary btn-sm flex items-center gap-1.5">
                    Update Status <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        </>
      )}

      {/* Status Update Modal */}
      <Modal open={!!statusModal} onClose={() => { setStatusModal(null); setNewStatus(''); setStatusNote('') }}
        title="Update Application Status">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <Avatar name={`${statusModal?.uid?.firstName} ${statusModal?.uid?.lastName}`}
              src={statusModal?.uid?.avatar?.secureUrl} size="sm" />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {statusModal?.uid?.firstName} {statusModal?.uid?.lastName}
              </p>
              <p className="text-xs text-gray-500">{statusModal?.uid?.email}</p>
            </div>
          </div>

          <div>
            <label className="label">New Status *</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
              <option value="">Select Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {newStatus === 'interview_scheduled' && (
            <div>
              <label className="label">Interview Date & Time *</label>
              <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                className="input" />
            </div>
          )}

          <div>
            <label className="label">Note to Candidate (Optional)</label>
            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
              rows={3} placeholder="Add a note for the candidate..."
              className="input resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStatusModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}
              className="btn-primary flex-1">
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
