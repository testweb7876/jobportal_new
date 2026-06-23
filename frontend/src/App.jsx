import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import useAuthStore from '@/store/authStore'
import api from '@/services/api'

// ── Layouts ──────────────────────────────────────────────────────────────────
import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// ── Guards ───────────────────────────────────────────────────────────────────
import ProtectedRoute from '@/components/common/ProtectedRoute'
import RoleRoute from '@/components/common/RoleRoute'

// ── Page Loading ─────────────────────────────────────────────────────────────
import PageLoader from '@/components/common/PageLoader'

// ── Public Pages ─────────────────────────────────────────────────────────────
const HomePage         = lazy(() => import('@/pages/public/HomePage'))
const JobsPage         = lazy(() => import('@/pages/public/JobsPage'))
const JobDetailPage    = lazy(() => import('@/pages/public/JobDetailPage'))
const CompaniesPage    = lazy(() => import('@/pages/public/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('@/pages/public/CompanyDetailPage'))
const AboutPage        = lazy(() => import('@/pages/public/AboutPage'))
const PaymentSuccess = lazy(() => import('@/pages/payment/PaymentSuccess'))
const PaymentCancel = lazy(() => import('@/pages/payment/PaymentCancel'))

// ── Auth Pages ───────────────────────────────────────────────────────────────
const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage     = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage    = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const SessionsPage     = lazy(() => import('@/pages/auth/SessionsPage'))
const OAuthCallbackPage = lazy(() => import('@/pages/auth/OAuthCallbackPage'))

// ── Job Seeker Pages ─────────────────────────────────────────────────────────
const JSDashboard      = lazy(() => import('@/pages/jobseeker/Dashboard'))
const JSProfile        = lazy(() => import('@/pages/jobseeker/Profile'))
const JSApplications   = lazy(() => import('@/pages/jobseeker/Applications'))
const JSResumes        = lazy(() => import('@/pages/jobseeker/Resumes'))
const CreateResume     = lazy(() => import('@/pages/jobseeker/CreateResume'))
const ResumeDetails    = lazy(() => import('@/pages/jobseeker/ResumeDetails'))
const EditResume       = lazy(() => import('@/pages/jobseeker/EditResume'))
const JSPackages = lazy(() => import('@/pages/jobseeker/Packages'))
const JSShortlisted    = lazy(() => import('@/pages/jobseeker/Shortlisted'))
const JSAlerts         = lazy(() => import('@/pages/jobseeker/JobAlerts'))
const JSMessages       = lazy(() => import('@/pages/jobseeker/Messages'))
const JSSettings       = lazy(() => import('@/pages/jobseeker/Settings'))
const JSInterviews     = lazy(() => import('@/pages/jobseeker/Interviews'))
const JSFollowing      = lazy(() => import('@/pages/jobseeker/Following'))

// ── Employer Pages ───────────────────────────────────────────────────────────
const EmpDashboard     = lazy(() => import('@/pages/employer/Dashboard'))
const EmpJobs          = lazy(() => import('@/pages/employer/Jobs'))
const EmpPostJob       = lazy(() => import('@/pages/employer/PostJob'))
const EmpApplications  = lazy(() => import('@/pages/employer/Applications'))
const EmpCandidates    = lazy(() => import('@/pages/employer/Candidates'))
const EmpCandidateDetail = lazy(() => import('@/pages/employer/CandidateDetail'))
const EmpCompany       = lazy(() => import('@/pages/employer/Company'))
const EmpMessages      = lazy(() => import('@/pages/employer/Messages'))
const EmpPackages      = lazy(() => import('@/pages/employer/Packages'))
const EmpSettings      = lazy(() => import('@/pages/employer/Settings'))
const EmpJobAnalytics  = lazy(() => import('@/pages/employer/JobAnalytics'))
const EmpInterviews    = lazy(() => import('@/pages/employer/Interviews'))

// ── Admin Pages ───────────────────────────────────────────────────────────────
const AdminDashboard   = lazy(() => import('@/pages/admin/Dashboard'))
const AdminUsers       = lazy(() => import('@/pages/admin/Users'))
const AdminJobs        = lazy(() => import('@/pages/admin/Jobs'))
const AdminCompanies   = lazy(() => import('@/pages/admin/Companies'))
const AdminPackages    = lazy(() => import('@/pages/admin/Packages'))
const AdminPayments    = lazy(() => import('@/pages/admin/Payments'))
const AdminReports     = lazy(() => import('@/pages/admin/Reports'))
const AdminSettings    = lazy(() => import('@/pages/admin/Settings'))
const AdminActivityLogs  = lazy(() => import('@/pages/admin/ActivityLogs'))
const AdminBankTransfers = lazy(() => import('@/pages/admin/BankTransfers'))
const AdminCategories    = lazy(() => import('@/pages/admin/Categories'))
const Revenue = lazy(() => import('@/pages/admin/Revenue'))
const Invoices = lazy(() => import('@/pages/admin/Invoices'))
const AdminAdmins      = lazy(() => import('@/pages/admin/Admins'))
const AdminBroadcast   = lazy(() => import('@/pages/admin/Broadcast'))
const AdminRefunds     = lazy(() => import('@/pages/admin/Refunds'))
const AdminAnalytics   = lazy(() => import('@/pages/admin/Analytics'))
const SuperAdminRoute = lazy(() => import('@/components/common/SuperAdminRoute'))



function App() {
  const { isAuthenticated, accessToken } = useAuthStore()

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
  }, [accessToken])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        {/* ── Public Routes ───────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"         element={<HomePage />} />
          <Route path="/jobs"     element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/companies"    element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/about"    element={<AboutPage />} />
        </Route>

        {/* ── Auth Routes ─────────────────────────────────────────────── */}
        <Route path="/login"          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register"       element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token"   element={<VerifyEmailPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />

        {/* ── Smart Dashboard Redirect ─────────────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        } />

        {/* ── Job Seeker Routes ───────────────────────────────────────── */}
        <Route path="/jobseeker" element={<ProtectedRoute><RoleRoute role="jobseeker"><DashboardLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard"    element={<JSDashboard />} />
          <Route path="profile"      element={<JSProfile />} />
          <Route path="applications" element={<JSApplications />} />
          <Route path="resumes"      element={<JSResumes />} />
          <Route path="resumes/create" element={<CreateResume />} />
          <Route path="resumes/:id" element={<ResumeDetails />} />
          <Route path="resumes/:id/edit" element={<EditResume />} />
          <Route path="packages" element={<JSPackages />} />
          <Route path="shortlisted"  element={<JSShortlisted />} />
          <Route path="alerts"       element={<JSAlerts />} />
          <Route path="messages"     element={<JSMessages />} />
          <Route path="settings"     element={<JSSettings />} />
          <Route path="interviews" element={<JSInterviews />} />
          <Route path="following"  element={<JSFollowing />} />
        </Route>

        {/* ── Employer Routes ─────────────────────────────────────────── */}
        <Route path="/employer" element={<ProtectedRoute><RoleRoute role="employer"><DashboardLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard"    element={<EmpDashboard />} />
          <Route path="jobs"         element={<EmpJobs />} />
          <Route path="jobs/post"    element={<EmpPostJob />} />
          <Route path="jobs/:id/edit" element={<EmpPostJob />} />
          <Route path="applications" element={<EmpApplications />} />
          <Route path="candidates"   element={<EmpCandidates />} />
          <Route path="candidates/:id"    element={<EmpCandidateDetail />} />
          <Route path="company"      element={<EmpCompany />} />
          <Route path="messages"     element={<EmpMessages />} />
          <Route path="packages"     element={<EmpPackages />} />
          <Route path="settings"     element={<EmpSettings />} />
          <Route path="jobs/:id/analytics" element={<EmpJobAnalytics />} />
          <Route path="interviews"         element={<EmpInterviews />} />
        </Route>

        {/* ── Admin Routes ────────────────────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute><RoleRoute role="admin"><AdminLayout /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="jobs"       element={<AdminJobs />} />
          <Route path="companies"  element={<AdminCompanies />} />
          <Route path="reports"    element={<AdminReports />} />
          <Route path="settings"   element={<AdminSettings />} />
          <Route path="activity-logs"   element={<AdminActivityLogs />} />
          <Route path="bank-transfers"  element={<AdminBankTransfers />} />
          <Route path="invoices" element={<Invoices />} />


          <Route path="revenue"   element={<SuperAdminRoute><Revenue /></SuperAdminRoute>} />
          <Route path="analytics" element={<SuperAdminRoute><AdminAnalytics /></SuperAdminRoute>} />
          <Route path="admins"    element={<SuperAdminRoute><AdminAdmins /></SuperAdminRoute>} />
          <Route path="packages"  element={<SuperAdminRoute><AdminPackages /></SuperAdminRoute>} />
          <Route path="refunds"   element={<SuperAdminRoute><AdminRefunds /></SuperAdminRoute>} />
          <Route path="broadcast" element={<SuperAdminRoute><AdminBroadcast /></SuperAdminRoute>} />
          <Route path="categories" element={<SuperAdminRoute><AdminCategories /></SuperAdminRoute>} />
          <Route path="payments"   element={<SuperAdminRoute><AdminPayments /></SuperAdminRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function DashboardRedirect() {
  const { user } = useAuthStore()
  if (user?.role === 'employer') return <Navigate to="/employer/dashboard" />
  if (user?.role === 'admin' || user?.role === 'superadmin') return <Navigate to="/admin/dashboard" />
  return <Navigate to="/jobseeker/dashboard" />
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <div className="text-center px-4">
        <h1 className="text-9xl font-display font-bold text-primary-600 opacity-20">404</h1>
        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-4">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary">Go Home</a>
      </div>
    </div>
  )
}

export default App
