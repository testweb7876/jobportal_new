import { Bell, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/UI'
export default function JSAlerts() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-1">Job Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400">Get notified about new matching jobs</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> Create Alert</button>
      </div>
      <EmptyState icon={Bell} title="No job alerts set up"
        description="Create alerts to get notified when jobs matching your criteria are posted."
        action={<button className="btn-primary"><Plus size={15} /> Create Your First Alert</button>} />
    </div>
  )
}
