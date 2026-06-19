import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import useAuthStore from '@/store/authStore'
import { Avatar } from '@/components/common/UI'
import NotificationPanel from '@/components/common/NotificationPanel'
import { LayoutDashboard, BarChart3, Receipt, Users, Briefcase, Building2, CreditCard, Flag, Settings, LogOut, Menu, ChevronRight, Bell, ShieldCheck, Package, Activity, Landmark, Tag } from 'lucide-react'

const adminNav = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/admin/dashboard' },
  { icon: Users,           label: 'Users',           href: '/admin/users' },
  { icon: Briefcase,       label: 'Jobs',            href: '/admin/jobs' },
  { icon: Building2,       label: 'Companies',       href: '/admin/companies' },
  { icon: Package,         label: 'Packages',        href: '/admin/packages' },
  { icon: CreditCard,      label: 'Payments',        href: '/admin/payments' },
  { icon: Landmark,        label: 'Bank Transfers',  href: '/admin/bank-transfers' },
  { icon: Tag,             label: 'Categories',      href: '/admin/categories' },
  { icon: Activity,        label: 'Activity Logs',   href: '/admin/activity-logs' },
  { icon: BarChart3,       label: 'Revenue Dashboard', href: '/admin/revenue'},
  { icon: Receipt,         label: 'Invoices',         href: '/admin/invoices'},
  { icon: Flag,            label: 'Reports',         href: '/admin/reports' },
  { icon: Settings,        label: 'Settings',        href: '/admin/settings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/') }

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-dark-900">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={17} className="text-white" />
          </div>
          <div>
            <span className="font-display text-base font-bold text-white">Admin Panel</span>
            <p className="text-xs text-gray-500">JobPortal</p>
          </div>
        </div>
      </div>

      <div className="p-4 mx-3 mt-4 rounded-xl bg-dark-800 border border-dark-700">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="sm" />
          <div>
            <p className="text-sm font-semibold text-white">{user?.firstName}</p>
            <span className="text-xs text-primary-400 font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {adminNav.map(item => {
          const active = location.pathname.startsWith(item.href)
          return (
            <Link key={item.href} to={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-dark-800 hover:text-white'
              )}>
              <item.icon size={17} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-dark-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-950 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0"><Sidebar /></aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden shadow-2xl">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 flex items-center px-6 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {location.pathname.split('/').pop().replace(/-/g, ' ')}
            </p>
          </div>
          <NotificationPanel isAuthenticated={true} />
          <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName}`} size="sm" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
