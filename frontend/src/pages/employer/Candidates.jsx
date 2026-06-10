import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User } from 'lucide-react'
import { Avatar, EmptyState } from '@/components/common/UI'

export default function EmpCandidates() {
  const [search, setSearch] = useState('')
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title mb-1">Browse Candidates</h1>
        <p className="text-gray-500 dark:text-gray-400">Search and discover qualified candidates</p>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by skills, title, location..." className="input pl-10 h-11" />
      </div>
      <EmptyState icon={User} title="Search for candidates"
        description="Use the search bar above to find qualified candidates for your positions." />
    </div>
  )
}
