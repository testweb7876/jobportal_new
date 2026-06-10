import { forwardRef } from 'react'
import { clsx } from 'clsx'

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={16} />
        </div>
      )}
      <input
        ref={ref}
        className={clsx(error ? 'input-error' : 'input', Icon && 'pl-10', className)}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <textarea
      ref={ref}
      className={clsx(error ? 'input-error' : 'input', 'resize-none', className)}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <select
      ref={ref}
      className={clsx(error ? 'input-error' : 'input', 'cursor-pointer', className)}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = 'md', loading, children, className, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }
  return (
    <button className={clsx(variants[variant], sizes[size], className)} disabled={loading} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ variant = 'gray', children, className }) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    gray: 'badge-gray',
  }
  return <span className={clsx(variants[variant], className)}>{children}</span>
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md', className }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-12 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }
  const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div className={clsx('rounded-full flex items-center justify-center font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex-shrink-0 overflow-hidden', sizes[size], className)}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, change, color = 'blue' }) {
  const colors = {
    blue: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
  }
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <span className={clsx('text-xs font-semibold', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children, className }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-dark-700">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-dark-700/50">
          {children}
        </tbody>
      </table>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-30 transition-colors">
        ←
      </button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = pages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? '...' : pages - (6 - i)
        return typeof p === 'number' ? (
          <button key={p} onClick={() => onPage(p)}
            className={clsx('w-9 h-9 rounded-lg text-sm font-medium transition-colors',
              p === page ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700')}>
            {p}
          </button>
        ) : <span key={i} className="w-9 h-9 flex items-center justify-center text-gray-400">...</span>
      })}
      <button onClick={() => onPage(page + 1)} disabled={page === pages}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-30 transition-colors">
        →
      </button>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={clsx('relative w-full card animate-scale-in', sizes[size])} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    approved: { v: 'success', l: 'Approved' },
    active: { v: 'success', l: 'Active' },
    hired: { v: 'success', l: 'Hired' },
    pending: { v: 'warning', l: 'Pending' },
    interview_scheduled: { v: 'primary', l: 'Interview' },
    shortlisted: { v: 'primary', l: 'Shortlisted' },
    reviewed: { v: 'primary', l: 'Reviewed' },
    rejected: { v: 'danger', l: 'Rejected' },
    expired: { v: 'danger', l: 'Expired' },
    withdrawn: { v: 'gray', l: 'Withdrawn' },
    applied: { v: 'gray', l: 'Applied' },
    draft: { v: 'gray', l: 'Draft' },
  }
  const s = map[status] || { v: 'gray', l: status }
  return <Badge variant={s.v}>{s.l}</Badge>
}
