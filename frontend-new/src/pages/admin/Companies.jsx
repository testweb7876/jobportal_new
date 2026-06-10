import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Building2, Eye } from 'lucide-react'
import { companyAPI } from '@/services/api'
import { Avatar, Table, Pagination, Modal, EmptyState, Badge } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected']

export default function AdminCompanies() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [verifyModal, setVerifyModal] = useState(null)
  const [verifyAction, setVerifyAction] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', { page, filter }],
    queryFn: () => companyAPI.getAll({
      page, limit: 20,
      ...(filter !== 'all' && { verificationStatus: filter }),
    }).then(r => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, note }) => companyAPI.update(id, { verificationStatus: status, isVerified: status === 'approved', verificationNote: note }),
    onSuccess: (_, vars) => {
      toast.success(`Company ${vars.status}`)
      setVerifyModal(null)
      setVerifyNote('')
      qc.invalidateQueries(['admin-companies'])
    },
    onError: () => toast.error('Action failed'),
  })

  const companies = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Company Management</h1>
        <p className="text-gray-500 dark:text-gray-400">{pagination.total || 0} total companies</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {FILTER_TABS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize',
              filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            )}>
            {f === 'all' ? 'All Companies' : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-4 space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" />
      ) : (
        <div className="card overflow-hidden">
          <Table headers={['Company', 'Verification', 'Followers', 'Jobs', 'Actions']}>
            {companies.map(company => (
              <tr key={company._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {company.logo?.secureUrl
                        ? <img src={company.logo.secureUrl} alt="" className="w-full h-full object-cover" />
                        : <Building2 size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        {company.name}
                        {company.isVerified && <CheckCircle size={13} className="text-primary-500" />}
                      </p>
                      <p className="text-xs text-gray-500">{company.city || 'No location'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className={clsx('badge capitalize',
                    company.verificationStatus === 'approved' ? 'badge-success' :
                    company.verificationStatus === 'pending' ? 'badge-warning' :
                    company.verificationStatus === 'rejected' ? 'badge-danger' : 'badge-gray'
                  )}>
                    {company.verificationStatus || 'not submitted'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{company.followersCount || 0}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{company.jobsCount || 0}</span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1">
                    <Link to={`/companies/${company.slug || company._id}`} target="_blank"
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 hover:text-primary-600 transition-colors">
                      <Eye size={13} />
                    </Link>
                    {company.verificationStatus === 'pending' && (
                      <>
                        <button onClick={() => { setVerifyModal(company); setVerifyAction('approved') }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors">
                          <CheckCircle size={13} />
                        </button>
                        <button onClick={() => { setVerifyModal(company); setVerifyAction('rejected') }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                          <XCircle size={13} />
                        </button>
                      </>
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

      <Modal open={!!verifyModal} onClose={() => { setVerifyModal(null); setVerifyNote('') }}
        title={`${verifyAction === 'approved' ? 'Verify' : 'Reject'} Company`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
            <Building2 size={18} className="text-gray-400" />
            <p className="font-semibold text-gray-900 dark:text-white">{verifyModal?.name}</p>
          </div>
          <div>
            <label className="label">{verifyAction === 'rejected' ? 'Rejection Reason *' : 'Note (Optional)'}</label>
            <textarea value={verifyNote} onChange={e => setVerifyNote(e.target.value)} rows={3}
              placeholder={verifyAction === 'rejected' ? 'Why is this company being rejected?' : 'Add a note...'}
              className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setVerifyModal(null); setVerifyNote('') }} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => {
                if (verifyAction === 'rejected' && !verifyNote.trim()) { toast.error('Rejection reason required'); return }
                verifyMutation.mutate({ id: verifyModal._id, status: verifyAction, note: verifyNote })
              }}
              disabled={verifyMutation.isPending}
              className={verifyAction === 'approved' ? 'btn-primary flex-1' : 'btn-danger flex-1'}>
              {verifyMutation.isPending ? 'Processing...' : verifyAction === 'approved' ? 'Verify Company' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
