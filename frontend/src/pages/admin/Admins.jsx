import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserCheck, UserX, Shield } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Avatar, Table, Modal, EmptyState } from '@/components/common/UI'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function AdminAdmins() {
  const qc = useQueryClient()
  const [createModal, setCreateModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: () => adminAPI.getAdmins().then(r => r.data?.admins || []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createAdmin(data),
    onSuccess: () => {
      toast.success('Admin created!')
      setCreateModal(false)
      reset()
      qc.invalidateQueries(['admin-admins'])
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateAdminStatus(id, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['admin-admins']) },
    onError: () => toast.error('Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteAdmin(id),
    onSuccess: () => { toast.success('Admin deleted'); qc.invalidateQueries(['admin-admins']) },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed'),
  })

  const admins = data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Admin Accounts</h1>
          <p className="text-gray-500 dark:text-gray-400">{admins.length} admins</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <Plus size={15} /> Create Admin
        </button>
      </div>

      {isLoading ? (
        <div className="card p-4 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-dark-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <EmptyState icon={Shield} title="No admins found" />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Admin', 'Role', 'Status', 'Created', 'Actions']}>
            {admins.map(admin => (
              <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${admin.firstName} ${admin.lastName}`}
                      src={admin.avatar?.secureUrl} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {admin.firstName} {admin.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`badge ${admin.role === 'superadmin' ? 'badge-primary' : 'badge-gray'} capitalize`}>
                    {admin.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`badge ${admin.status === 'active' ? 'badge-success' : 'badge-danger'} capitalize`}>
                    {admin.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(admin.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {admin.role !== 'superadmin' && (
                    <div className="flex gap-1">
                      {admin.status !== 'active' ? (
                        <button onClick={() => statusMutation.mutate({ id: admin._id, status: 'active' })}
                          className="btn-ghost btn-sm text-emerald-600" title="Activate">
                          <UserCheck size={13} />
                        </button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: admin._id, status: 'suspended' })}
                          className="btn-ghost btn-sm text-amber-600" title="Suspend">
                          <UserX size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => { if(confirm(`Delete ${admin.firstName}?`)) deleteMutation.mutate(admin._id) }}
                        className="btn-ghost btn-sm text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      <Modal open={createModal} onClose={() => { setCreateModal(false); reset() }} title="Create New Admin">
        <form onSubmit={handleSubmit(d => createMutation.mutate({ ...d, role: 'admin' }))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input {...register('firstName', { required: 'Required' })} className="input" placeholder="Rahul" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input {...register('lastName', { required: 'Required' })} className="input" placeholder="Sharma" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email', { required: 'Required' })} type="email" className="input" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
              type="password" className="input" placeholder="Strong password" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setCreateModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}