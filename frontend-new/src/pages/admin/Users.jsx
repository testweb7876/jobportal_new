import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Shield, MoreVertical } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Avatar, Badge, Table, Pagination, Modal, EmptyState } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const ROLE_TABS = ['all', 'jobseeker', 'employer', 'admin']
const STATUS_MAP = {
  active: 'success',
  pending: 'warning',
  suspended: 'danger',
  banned: 'danger',
}

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, role, search }],
    queryFn: () => adminAPI.getUsers({
      page, limit: 20, search,
      ...(role !== 'all' && { role }),
    }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateUserStatus(id, { status }),
    onSuccess: () => {
      toast.success('User status updated')
      setActionModal(null)
      qc.invalidateQueries(['admin-users'])
    },
    onError: () => toast.error('Failed to update user'),
  })

  const users = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {ROLE_TABS.map(r => (
            <button key={r} onClick={() => { setRole(r); setPage(1) }}
              className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
                role === r ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              )}>
              {r === 'all' ? 'All Users' : r}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email..." className="input pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-4 space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse items-center">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Search} title="No users found" description="Try adjusting your search filters" />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['User', 'Role', 'Status', 'Joined', 'Last Login', 'Actions']}>
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${user.firstName} ${user.lastName}`}
                      src={user.avatar?.secureUrl} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="badge badge-gray capitalize">{user.role}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`badge badge-${STATUS_MAP[user.status] || 'gray'} capitalize`}>{user.status}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">
                    {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    {user.status !== 'active' && (
                      <button onClick={() => statusMutation.mutate({ id: user._id, status: 'active' })}
                        className="btn-ghost btn-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1"
                        title="Activate">
                        <UserCheck size={13} />
                      </button>
                    )}
                    {user.status !== 'suspended' && (
                      <button onClick={() => statusMutation.mutate({ id: user._id, status: 'suspended' })}
                        className="btn-ghost btn-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-1"
                        title="Suspend">
                        <UserX size={13} />
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button onClick={() => setActionModal(user)}
                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Ban">
                        <Shield size={13} />
                      </button>
                    )}
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

      {/* Ban Confirm Modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title="Ban User">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Are you sure you want to ban <strong>{actionModal?.firstName} {actionModal?.lastName}</strong>?
            They will not be able to access the platform.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => statusMutation.mutate({ id: actionModal._id, status: 'banned' })}
              disabled={statusMutation.isPending} className="btn-danger flex-1">
              {statusMutation.isPending ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
