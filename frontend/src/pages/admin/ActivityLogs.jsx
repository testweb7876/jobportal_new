// src/pages/admin/ActivityLogs.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Search } from 'lucide-react'
import { adminAPI } from '@/services/api'
import { Pagination, EmptyState, Avatar } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import { useDebounce } from 'use-debounce'

export default function ActivityLogs() {
  const [page, setPage]     = useState(1)
  const [uid, setUid]       = useState('')
  const [debouncedUid]      = useDebounce(uid, 500)

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, debouncedUid],
    queryFn: () =>
      adminAPI.getActivityLogs({
        page, limit: 20,
        ...(debouncedUid && { uid: debouncedUid }),
      }).then(r => r.data),
  })

  const logs       = data?.data       || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Activity Logs</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {pagination.total || 0} log entries
        </p>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={uid}
            onChange={e => { setUid(e.target.value); setPage(1) }}
            placeholder="Filter by User ID..."
            className="input pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
                <div className="h-2.5 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="No activity logs found" />
      ) : (
        <>
          <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-dark-700/50">
            {logs.map(log => (
              <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                <Avatar
                  name={`${log.uid?.firstName || '?'} ${log.uid?.lastName || ''}`}
                  src={log.uid?.avatar?.secureUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {log.uid?.firstName} {log.uid?.lastName}
                    </span>
                    <span className="badge badge-gray capitalize text-xs">{log.uid?.role}</span>
                    <span className={`badge text-xs capitalize ${
                      log.action?.includes('delete') ? 'badge-danger' :
                      log.action?.includes('create') || log.action?.includes('register') ? 'badge-success' :
                      'badge-primary'
                    }`}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    {log.ip && ` · ${log.ip}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        </>
      )}
    </div>
  )
}