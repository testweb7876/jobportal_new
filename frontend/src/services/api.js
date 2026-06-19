import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('jp-auth') || '{}')
    const token = auth?.state?.accessToken
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []
 
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}
 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
 
      try {
        const auth = JSON.parse(localStorage.getItem('jp-auth') || '{}')
        const refreshToken = auth?.state?.refreshToken
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
        const newToken = data.data.accessToken
        const stored = JSON.parse(localStorage.getItem('jp-auth') || '{}')
        if (stored?.state) {
          stored.state.accessToken = newToken
          if (data.refreshToken) stored.state.refreshToken = data.refreshToken
          localStorage.setItem('jp-auth', JSON.stringify(stored))
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('jp-auth')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    const message = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)
export default api

// ── API Helpers ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.patch(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  getMe: () => api.get('/auth/me'),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
  changePassword: (data) => api.patch('/auth/change-password', data),
}

export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  myJobs: (params) => api.get('/jobs/my-jobs', { params }),
  shortlist: (id) => api.post(`/jobs/${id}/shortlist`),
  getShortlisted: () => api.get('/jobs/shortlisted'),
  getFeatured: () => api.get('/jobs/featured'),
  moderate: (id, data) => api.patch(`/jobs/${id}/moderate`, data),
  analytics: (id) => api.get(`/jobs/${id}/analytics`),
  getPublicStats: () => api.get('/jobs/stats'),
}

export const applicationAPI = {
  apply: (data) => api.post('/applications', data),
  myApplications: (params) => api.get('/applications/my', { params }),
  jobApplications: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  getOne: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  withdraw: (id, data) => api.patch(`/applications/${id}/withdraw`, data),
  rate: (id, data) => api.patch(`/applications/${id}/rate`, data),
  companyOverview: () => api.get('/applications/company-overview'),
}

export const companyAPI = {
  getAll: (params) => api.get('/companies', { params }),
  getOne: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.patch(`/companies/${id}`, data),
  getMyCompany: () => api.get('/companies/my-company'),
  uploadLogo: (formData) => api.post('/companies/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  follow: (id) => api.post(`/companies/${id}/follow`),
  submitVerification: (formData) => api.post('/companies/verify/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const resumeAPI = {
  getAll: (params) => api.get('/resumes', { params }),
  getOne: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.patch(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  getMyResumes: () => api.get('/resumes/my'),
  uploadFile:       (id, formData) =>
    api.post(`/resumes/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile:       (id, publicId) =>
    api.delete(`/resumes/${id}/files/${encodeURIComponent(publicId)}`),
  setVisibility:    (id, data)     => api.patch(`/resumes/${id}/visibility`, data),
  generateShareLink:(id)           => api.post(`/resumes/${id}/share`),
  toggleFeatured:   (id)           => api.patch(`/resumes/${id}/feature`),
}

export const packageAPI = {
  getAll: (params) => api.get('/packages', { params }),
  getOne: (id) => api.get(`/packages/${id}`),
  getMyPackage: () => api.get('/packages/my-package'),
}
 
export const settingsAPI = {
  getBankDetails:    () => api.get('/admin/settings/bank/public'),  
  updateBankDetails: (data) => api.patch('/admin/settings/bank', data),  
}

export const paymentAPI = {
  createStripeSession: (data) => api.post('/payments/stripe/create-session', data),
  createPaypalOrder:   (data) => api.post('/payments/paypal/create-order', data),
  capturePaypal:       (data) => api.post('/payments/paypal/capture', data),
  submitBankProof: (formData) =>
  api.post('/payments/bank/submit-proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  requestRefund:  (id)   => api.post(`/payments/${id}/refund`),
  activateFree:   (data) => api.post('/payments/free/activate', data),
  history:        (params) => api.get('/payments/history', { params }),
}
 
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  unreadCount: () => api.get('/notifications/unread-count'),
}

export const interviewsAPI = {
  getUpcoming: () => api.get('/interviews'),
}
 
export const followersAPI = {
  getFollowing: () => api.get('/followers/following'),
}
 
export const reportsAPI = {
  submit: (data) => api.post('/reports', data),
}
 
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreate: (data) => api.post('/messages/conversations', data),
  getMessages: (id, params) => api.get(`/messages/conversations/${id}`, { params }),
  send: (id, data) => api.post(`/messages/conversations/${id}`, data),
}

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  getAllJobs: (params) => api.get('/admin/jobs', { params }),
  revenue: (params) => api.get('/admin/revenue', { params }),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
  getBankTransfers: () => api.get('/payments/bank-transfers'),
  approveBankTransfer: (id) => api.patch(`/payments/bank/${id}/approve`),
  activityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getInvoices: (params) => api.get('/admin/invoices', { params }),
  getSystemErrors:   ()         => api.get('/admin/system-errors'),
  getActivityLogs:   (params)   => api.get('/admin/activity-logs', { params }),
  createCategory:    (data)     => api.post('/categories/categories', data),
  updateCategory:    (id, data) => api.patch(`/categories/categories/${id}`, data),
  deleteCategory:    (id)       => api.delete(`/categories/categories/${id}`),
  createJobType:     (data)     => api.post('/categories/job-types', data),
  updateJobType:     (id, data) => api.patch(`/categories/job-types/${id}`, data),
  deleteJobType:     (id)       => api.delete(`/categories/job-types/${id}`),
  revenue: (params) => api.get('/admin/revenue', { params }),
  getInvoices: (params) => api.get('/admin/invoices', { params }),
}

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  getSaved: () => api.get('/search/saved'),
  saveSearch: (data) => api.post('/search/saved', data),
  deleteSearch: (id) => api.delete(`/search/saved/${id}`),
}
 
export const categoriesAPI = {
  getCategories: () => api.get('/categories/categories'),
  getJobTypes: () => api.get('/categories/job-types'),
  getCareerLevels: () => api.get('/categories/career-levels'),
  getCountries: () => api.get('/categories/countries'),
  getStates: (id) => api.get(`/categories/states/${id}`),
  getCities: (id) => api.get(`/categories/cities/${id}`),
}

export const uploadAPI = {
  image: (formData, folder) => api.post(`/uploads/image?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  file: (formData, folder) => api.post(`/uploads/file?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFile: (publicId) => api.delete(`/uploads/delete/${encodeURIComponent(publicId)}`),
}
 
export const alertsAPI = {
  getAll: () => api.get('/job-alerts'),
  create: (data) => api.post('/job-alerts', data),
  update: (id, data) => api.patch(`/job-alerts/${id}`, data),
  delete: (id) => api.delete(`/job-alerts/${id}`),
  toggle: (id, status) =>
    api.patch(`/job-alerts/${id}`, { status }),
}