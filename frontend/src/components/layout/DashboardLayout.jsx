import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import useAuthStore from '@/store/authStore'
import { Avatar } from '@/components/common/UI'
import {
  LayoutDashboard, Briefcase, FileText, Bookmark, Bell, MessageSquare,
  Settings, LogOut, Menu, X, Building2, Users, Package, Sun, Moon,
  ChevronRight, User
} from 'lucide-react'
import { useEffect } from 'react'
import NotificationPanel from '@/components/common/NotificationPanel'

const jobseekerNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/jobseeker/dashboard' },
  { icon: Briefcase, label: 'Browse Jobs', href: '/jobs' },
  { icon: FileText, label: 'My Applications', href: '/jobseeker/applications' },
  { icon: User, label: 'My Resumes', href: '/jobseeker/resumes' },
  { icon: Bookmark, label: 'Shortlisted', href: '/jobseeker/shortlisted' },
  { icon: Bell, label: 'Job Alerts', href: '/jobseeker/alerts' },
  { icon: Package,       label: 'Packages',    href: '/jobseeker/packages' },
  { icon: MessageSquare, label: 'Messages', href: '/jobseeker/messages' },
  { icon: Settings, label: 'Settings', href: '/jobseeker/settings' },
]

const employerNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/employer/dashboard' },
  { icon: Briefcase, label: 'My Jobs', href: '/employer/jobs' },
  { icon: FileText, label: 'Applications', href: '/employer/applications' },
  { icon: Users, label: 'Candidates', href: '/employer/candidates' },
  { icon: Building2, label: 'Company', href: '/employer/company' },
  { icon: MessageSquare, label: 'Messages', href: '/employer/messages' },
  { icon: Package, label: 'Packages', href: '/employer/packages' },
  { icon: Settings, label: 'Settings', href: '/employer/settings' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const nav = user?.role === 'employer' ? employerNav : jobseekerNav
  const basePath = user?.role === 'employer' ? '/employer' : '/jobseeker'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = async () => { await logout(); navigate('/') }

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx(
      'flex flex-col h-full',
      mobile ? 'bg-white dark:bg-dark-900' : 'bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-dark-700'
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-dark-700">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <Briefcase size={17} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold text-gray-900 dark:text-white">
            Job<span className="text-primary-600">Portal</span>
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 mx-3 mt-4 rounded-2xl bg-gray-50 dark:bg-dark-800">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {nav.map(item => {
          const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} to={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
              )}>
              <item.icon size={17} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-100 dark:border-dark-700 space-y-0.5">
        <button onClick={() => setDark(!dark)}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden shadow-2xl">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-700 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
            <Menu size={18} className="text-gray-600 dark:text-gray-300" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
            </p>
          </div>
          <NotificationPanel isAuthenticated={true} />

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {user?.role === 'employer' && (
              <Link to="/employer/jobs/post" className="btn-primary btn-sm hidden md:flex">
                + Post Job
              </Link>
            )}
            <Avatar src={user?.avatar?.secureUrl} name={`${user?.firstName} ${user?.lastName}`} size="sm" className="cursor-pointer" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
