import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Edit2, Trash2, Users, MoreVertical, Search } from 'lucide-react'
import { jobsAPI } from '@/services/api'
import { StatusBadge, EmptyState, Pagination, Modal, Table } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_TABS = ['all', 'approved', 'pending', 'rejected', 'expired', 'draft']

export default function EmpJobs() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs', { page, status: statusFilter, search }],
    queryFn: () => jobsAPI.myJobs({
      page, limit: 10,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => jobsAPI.delete(id),
    onSuccess: () => {
      toast.success('Job deleted')
      setDeleteModal(null)
      qc.invalidateQueries(['my-jobs'])
    },
    onError: () => toast.error('Failed to delete job'),
  })

  const jobs = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">My Job Listings</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} total jobs</p>
        </div>
        <Link to="/employer/jobs/post" className="btn-primary">
          <Plus size={15} /> Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              )}>
              {s === 'all' ? 'All Jobs' : s}
            </button>
          ))}
        </div>
        <div className="relative sm:w-56 flex-shrink-0 ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..." className="input pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-6 space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="flex-1 h-4 bg-gray-200 dark:bg-dark-700 rounded" />
              <div className="w-20 h-4 bg-gray-200 dark:bg-dark-700 rounded" />
              <div className="w-16 h-4 bg-gray-200 dark:bg-dark-700 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Plus} title="No jobs found"
          description={statusFilter === 'all' ? "You haven't posted any jobs yet." : `No jobs with status "${statusFilter}"`}
          action={<Link to="/employer/jobs/post" className="btn-primary">Post Your First Job</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Job Title', 'Status', 'Views', 'Applications', 'Posted', 'Actions']}>
            {jobs.map(job => (
              <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{job.workplaceType} · {job.city || 'Remote'}</p>
                  </div>
                </td>
                <td className="py-4 px-4"><StatusBadge status={job.status} /></td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Eye size={13} className="text-gray-400" /> {job.viewsCount || 0}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Link to={`/employer/applications?jobId=${job._id}`}
                    className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
                    <Users size={13} /> {job.applicationsCount || 0}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Link to={`/jobs/${job.slug || job._id}`} target="_blank"
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Preview">
                      <Eye size={14} />
                    </Link>
                    <Link to={`/employer/jobs/${job._id}/edit`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit">
                      <Edit2 size={14} />
                    </Link>
                    <button onClick={() => setDeleteModal(job)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <div className="px-4 pb-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Job">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <strong>"{deleteModal?.title}"</strong>?
            This action cannot be undone and all applications will be affected.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteModal._id)}
              disabled={deleteMutation.isPending} className="btn-danger flex-1">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Job'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
