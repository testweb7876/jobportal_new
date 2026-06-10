// ── Format ────────────────────────────────────────────────────────────────────
export const formatSalary = (min, max, currency = '$') => {
  if (!min && !max) return 'Negotiable'
  if (min && max) return `${currency}${(min / 1000).toFixed(0)}k – ${currency}${(max / 1000).toFixed(0)}k`
  if (min) return `From ${currency}${(min / 1000).toFixed(0)}k`
  return `Up to ${currency}${(max / 1000).toFixed(0)}k`
}

export const formatNumber = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n?.toString() || '0'
}

export const truncate = (str, len = 100) =>
  str?.length > len ? str.slice(0, len) + '...' : str

// ── Validation ────────────────────────────────────────────────────────────────
export const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email)

export const isValidUrl = (url) => {
  try { new URL(url); return true } catch { return false }
}

export const passwordStrength = (password) => {
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&#]/.test(password)) score++
  return score
}

// ── Class Names ────────────────────────────────────────────────────────────────
export { clsx as cn } from 'clsx'

// ── Date Helpers ──────────────────────────────────────────────────────────────
export const isExpired = (date) => date && new Date() > new Date(date)

export const daysUntil = (date) => {
  const diff = new Date(date) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ── File Helpers ──────────────────────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const getFileExtension = (filename) =>
  filename?.split('.').pop()?.toLowerCase() || ''

export const isImageFile = (file) =>
  file?.type?.startsWith('image/') || false

// ── URL Helpers ───────────────────────────────────────────────────────────────
export const buildQueryString = (params) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return qs ? `?${qs}` : ''
}

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

// ── Status Helpers ────────────────────────────────────────────────────────────
export const getStatusColor = (status) => {
  const map = {
    approved: 'emerald',
    active: 'emerald',
    hired: 'emerald',
    pending: 'amber',
    reviewed: 'blue',
    shortlisted: 'blue',
    interview_scheduled: 'purple',
    rejected: 'red',
    expired: 'red',
    withdrawn: 'gray',
    applied: 'gray',
    draft: 'gray',
  }
  return map[status] || 'gray'
}
