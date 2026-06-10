import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '@/services/api'
import { AlertCircle, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function AdminSettings() {
  const { data: errorsData } = useQuery({
    queryKey: ['system-errors'],
    queryFn: () => adminAPI.getSystemErrors().then(r => r.data?.errors || []),
  })
  const errors = errorsData || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Admin Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">System configuration and error logs</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-600" />
          </div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">System Error Logs</h2>
        </div>
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <Activity size={16} /> <span className="text-sm font-medium">No system errors. Everything running smoothly! ✅</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errors.map(err => (
              <div key={err._id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-600">Error</span>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(err.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono">{err.error}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
