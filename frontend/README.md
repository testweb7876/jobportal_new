# 🎨 Job Portal — Frontend Documentation

Production-grade React + Vite frontend for the Job Portal SaaS platform. Built with TailwindCSS, TanStack Query, Zustand, Framer Motion, and Socket.io.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── UI.jsx                     # Shared UI kit (Input, Button, Badge, Modal, Table, Pagination, Avatar, StatCard, EmptyState, Skeleton, StatusBadge)
│   │   ├── NotificationPanel.jsx      # Bell icon dropdown with real-time notifications, mark read, delete
│   │   ├── PageLoader.jsx             # Full-screen loading spinner (used in Suspense)
│   │   ├── ProtectedRoute.jsx         # Redirects unauthenticated users to /login
│   │   └── RoleRoute.jsx              # Redirects users with wrong role to /dashboard
│   ├── layout/
│   │   ├── PublicLayout.jsx           # Navbar + Footer wrapper for public pages
│   │   ├── DashboardLayout.jsx        # Sidebar + topbar for jobseeker and employer dashboards
│   │   ├── AdminLayout.jsx            # Dark sidebar + topbar for admin panel
│   │   ├── Navbar.jsx                 # Public navbar with dark mode, notification bell, user menu
│   │   └── Footer.jsx                 # Public footer with nav links and social icons
│   └── profile/
│       └── SkillsCard.jsx             # Skill tag add/remove with save mutation (used in JSProfile)
├── hooks/
│   └── index.js                       # useDebounce, useLocalStorage, useClickOutside, useIntersectionObserver, usePagination, useWindowSize, useSocket
├── pages/
│   ├── admin/
│   │   ├── Dashboard.jsx              # Stats cards, revenue charts (bar + pie), recent users, pending jobs
│   │   ├── Users.jsx                  # User list with role/status filters, search, activate/suspend/ban actions
│   │   ├── Jobs.jsx                   # Job moderation — approve/reject with note modal, status filter tabs
│   │   ├── Companies.jsx              # Company list with verification status filter, approve/reject modal
│   │   ├── Packages.jsx               # Full CRUD for subscription packages — create/edit/deactivate with feature quota inputs
│   │   ├── Payments.jsx               # Invoice list with status and payment method filters, pagination
│   │   ├── Reports.jsx                # User-submitted reports — review, resolve, dismiss with note
│   │   ├── ActivityLogs.jsx           # Activity log viewer with user ID filter
│   │   ├── BankTransfers.jsx          # Pending bank transfer proofs — view document, approve
│   │   ├── Categories.jsx             # CRUD for Job Categories and Job Types in tabbed view
│   │   └── Settings.jsx               # System error log viewer
│   ├── auth/
│   │   ├── LoginPage.jsx              # Email + password login with split layout, redirect to intended route
│   │   ├── RegisterPage.jsx           # Role selector (jobseeker/employer) + registration form
│   │   ├── ForgotPasswordPage.jsx     # Send password reset email
│   │   ├── ResetPasswordPage.jsx      # Reset password with token from URL
│   │   ├── VerifyEmailPage.jsx        # Auto-verify email on mount using URL token
│   │   └── SessionsPage.jsx           # List active sessions/devices, revoke individual sessions
│   ├── employer/
│   │   ├── Dashboard.jsx              # Stats, weekly area chart (views/applications), recent applicants, job list
│   │   ├── Jobs.jsx                   # My jobs table with status tabs, search, edit/delete/preview actions
│   │   ├── PostJob.jsx                # Full job creation/edit form (title, category, salary, description, tags, contact)
│   │   ├── Applications.jsx           # Job selector → applicant list → status update modal with interview date
│   │   ├── Candidates.jsx             # Browse public resumes with search, ATS score, tags
│   │   ├── CandidateDetail.jsx        # Full resume view with work/education history, start chat button
│   │   ├── Company.jsx                # Company profile CRUD, logo upload, gallery, social links, verification submit
│   │   ├── Messages.jsx               # Chat UI with conversation list and real-time messaging via Socket.io
│   │   ├── Packages.jsx               # Subscription packages with Stripe/PayPal/free activation, active plan quotas
│   │   ├── Interviews.jsx             # Upcoming and past interview-scheduled applications (re-exports shared page)
│   │   └── Settings.jsx               # Re-exports jobseeker Settings (change password, delete account)
│   ├── jobseeker/
│   │   ├── Dashboard.jsx              # Welcome, stats cards, recent applications, profile completion, recommended jobs
│   │   ├── Profile.jsx                # Avatar upload, personal info, social links, resume upload, job preferences, skills
│   │   ├── Applications.jsx           # Application list with status filter tabs, withdraw modal, status timeline
│   │   ├── Resumes.jsx                # Resume cards with ATS score, published/searchable badges, create/delete
│   │   ├── CreateResume.jsx           # Full resume builder (education, experience, languages, addresses, visibility)
│   │   ├── EditResume.jsx             # Pre-filled edit form for existing resume
│   │   ├── ResumeDetails.jsx          # Resume detail view + share link, feature toggle, visibility modal, file upload/delete
│   │   ├── Packages.jsx               # Jobseeker subscription packages, active plan usage bars, payment history
│   │   ├── Shortlisted.jsx            # Grid of shortlisted/bookmarked jobs
│   │   ├── JobAlerts.jsx              # CRUD for job alerts with keyword/category/workplace filters, toggle active/paused
│   │   ├── Messages.jsx               # Chat UI identical to employer, auto-selects conversation from navigate state
│   │   ├── Following.jsx              # Companies the user follows — unfollow button, link to company page
│   │   ├── Interviews.jsx             # Upcoming and past scheduled interviews with countdown and type icon
│   │   └── Settings.jsx               # Change password form, delete account with confirmation modal
│   ├── public/
│   │   ├── HomePage.jsx               # Hero with search, category grid, featured jobs, features section, CTA banner
│   │   ├── JobsPage.jsx               # Job listing with live filters (keyword, city, category, type, workplace, salary, sort)
│   │   ├── JobDetailPage.jsx          # Full job view, apply modal, shortlist, share, similar jobs, company card
│   │   ├── CompaniesPage.jsx          # Company grid with keyword and city search
│   │   ├── CompanyDetailPage.jsx      # Company hero, about, gallery lightbox, open positions, social links
│   │   └── AboutPage.jsx              # Static about page
│   └── payment/
│       ├── PaymentSuccess.jsx         # Stripe success redirect page with session ID display
│       └── PaymentCancel.jsx          # Stripe cancel redirect page with retry button
├── services/
│   └── api.js                         # Axios instance with JWT interceptor, token refresh, all API helper objects
├── store/
│   └── authStore.js                   # Zustand store (persisted) — user, accessToken, refreshToken, setAuth, updateUser, logout
├── utils/
│   └── helpers.js                     # formatSalary, formatNumber, truncate, isValidEmail, isValidUrl, passwordStrength, formatFileSize, getInitials, getStatusColor, buildQueryString
├── App.jsx                            # All routes: public, auth, jobseeker, employer, admin, smart /dashboard redirect
├── main.jsx                           # ReactDOM root, QueryClient, BrowserRouter, Toaster setup
└── styles/
    └── globals.css                    # Tailwind base, component classes (card, btn-*, input, badge-*, label, etc.)
```

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env

# Start dev server (runs on port 3000)
npm run dev
```

---

## 🌍 Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=JobPortal
VITE_APP_URL=http://localhost:3000
```

---

## 🗺️ Route Map

### Public Routes (inside `PublicLayout` — Navbar + Footer)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page with hero, categories, featured jobs |
| `/jobs` | `JobsPage` | Job listing with filters |
| `/jobs/:id` | `JobDetailPage` | Single job detail, apply, shortlist |
| `/companies` | `CompaniesPage` | Company directory |
| `/companies/:id` | `CompanyDetailPage` | Company profile with gallery |
| `/about` | `AboutPage` | Static about page |

### Auth Routes (no layout)

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Login — redirects if already authenticated |
| `/register` | `RegisterPage` | Registration with role selector |
| `/forgot-password` | `ForgotPasswordPage` | Request password reset email |
| `/reset-password/:token` | `ResetPasswordPage` | Reset password with URL token |
| `/verify-email/:token` | `VerifyEmailPage` | Auto-verify email address |
| `/dashboard` | `DashboardRedirect` | Smart redirect by role |

### Payment Routes (no layout)

| Path | Component | Description |
|------|-----------|-------------|
| `/payment/success` | `PaymentSuccess` | Stripe success callback |
| `/payment/cancel` | `PaymentCancel` | Stripe cancel callback |

### Jobseeker Routes (inside `DashboardLayout`, protected, role=jobseeker)

| Path | Component | Description |
|------|-----------|-------------|
| `/jobseeker/dashboard` | `JSDashboard` | Stats, recent apps, recommendations |
| `/jobseeker/profile` | `JSProfile` | Edit profile, avatar, preferences, skills |
| `/jobseeker/applications` | `JSApplications` | My applications with status filter |
| `/jobseeker/resumes` | `JSResumes` | Resume list with ATS scores |
| `/jobseeker/resumes/create` | `CreateResume` | Full resume builder |
| `/jobseeker/resumes/:id` | `ResumeDetails` | View resume + share/feature/visibility/upload |
| `/jobseeker/resumes/:id/edit` | `EditResume` | Edit existing resume |
| `/jobseeker/packages` | `JSPackages` | Plans, active quotas, payment history |
| `/jobseeker/shortlisted` | `JSShortlisted` | Bookmarked jobs |
| `/jobseeker/alerts` | `JSAlerts` | Job alert CRUD with toggle |
| `/jobseeker/messages` | `JSMessages` | Real-time chat |
| `/jobseeker/following` | `Following` | Followed companies with unfollow |
| `/jobseeker/interviews` | `Interviews` | Upcoming/past interview schedule |
| `/jobseeker/settings` | `JSSettings` | Change password, delete account |

### Employer Routes (inside `DashboardLayout`, protected, role=employer)

| Path | Component | Description |
|------|-----------|-------------|
| `/employer/dashboard` | `EmpDashboard` | Stats, chart, recent applicants, job list |
| `/employer/jobs` | `EmpJobs` | My jobs with status tabs, delete modal |
| `/employer/jobs/post` | `EmpPostJob` | Post new job |
| `/employer/jobs/:id/edit` | `EmpPostJob` | Edit existing job (same component) |
| `/employer/jobs/:id/analytics` | `JobAnalytics` | Views, application count, status breakdown charts |
| `/employer/applications` | `EmpApplications` | Applications per job, status update modal |
| `/employer/candidates` | `EmpCandidates` | Browse public resumes |
| `/employer/candidates/:id` | `EmpCandidateDetail` | Full resume view, message button |
| `/employer/company` | `EmpCompany` | Company profile, logo, gallery, verification |
| `/employer/messages` | `EmpMessages` | Real-time chat |
| `/employer/packages` | `EmpPackages` | Plans, active quotas, Stripe/PayPal/free payment |
| `/employer/interviews` | `Interviews` | Upcoming/past scheduled interviews |
| `/employer/settings` | `EmpSettings` | Change password, delete account |

### Admin Routes (inside `AdminLayout`, protected, role=admin/superadmin)

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/dashboard` | `AdminDashboard` | Platform stats, revenue charts, recent users, pending jobs |
| `/admin/users` | `AdminUsers` | User list, role/status filter, search, activate/suspend/ban |
| `/admin/jobs` | `AdminJobs` | Job moderation with approve/reject modal |
| `/admin/companies` | `AdminCompanies` | Company verification — approve/reject |
| `/admin/packages` | `AdminPackages` | Full package CRUD with feature quota editor |
| `/admin/payments` | `AdminPayments` | All invoices with status/method filters |
| `/admin/bank-transfers` | `BankTransfers` | Pending bank proofs — view document, approve |
| `/admin/reports` | `AdminReports` | User reports — resolve or dismiss with note |
| `/admin/activity-logs` | `ActivityLogs` | Activity log with user filter |
| `/admin/categories` | `AdminCategories` | CRUD for job categories and job types |
| `/admin/settings` | `AdminSettings` | System error log |

---

## 🔑 Authentication Flow

Token storage uses **Zustand persist** (`localStorage` key: `jp-auth`).

```
Login → setAuth(user, accessToken, refreshToken)
      → api.defaults.headers['Authorization'] = Bearer token

Every request → interceptor reads token from store
401 received  → auto-refresh via POST /auth/refresh-token
              → retry original request with new token
Refresh fails → clear store → redirect /login
```

Roles: `jobseeker` · `employer` · `admin` · `superadmin`  
Admin and superadmin can access all routes. `RoleRoute` checks `user.role`.

---

## 🧩 Shared UI Components (`src/components/common/UI.jsx`)

| Component | Props | Usage |
|-----------|-------|-------|
| `Input` | `label, error, icon, ...inputProps` | Form inputs with icon and error |
| `Textarea` | `label, error, ...textareaProps` | Resizable textarea |
| `Select` | `label, error, children, ...selectProps` | Dropdown select |
| `Button` | `variant, size, loading, children` | Primary/secondary/outline/danger/ghost |
| `Badge` | `variant` (primary/success/warning/danger/gray) | Status pill |
| `StatusBadge` | `status` | Maps app statuses to Badge variants automatically |
| `Skeleton` | `className` | Gray shimmer placeholder |
| `SkeletonCard` | — | Pre-built card skeleton |
| `EmptyState` | `icon, title, description, action` | Empty list placeholder |
| `Avatar` | `src, name, size` (sm/md/lg/xl) | Image or initials fallback |
| `StatCard` | `icon, label, value, change, color` | Dashboard metric card |
| `Table` | `headers, children` | Responsive table with styled header |
| `Pagination` | `page, pages, onPage` | Page number buttons with ellipsis |
| `Modal` | `open, onClose, title, size` (sm/md/lg/xl) | Backdrop + card modal |

---

## 🌐 API Services (`src/services/api.js`)

All exports are grouped by domain:

| Export | Covers |
|--------|--------|
| `authAPI` | register, login, logout, refresh, verify email, forgot/reset/change password, sessions |
| `jobsAPI` | CRUD jobs, shortlist, featured, analytics, moderate |
| `applicationAPI` | apply, my apps, job apps, update status, withdraw, rate, company overview |
| `companyAPI` | CRUD company, logo upload, gallery, follow, verification |
| `resumeAPI` | CRUD resumes, upload file, delete file, visibility, share link, toggle featured |
| `packageAPI` | list packages, my package |
| `paymentAPI` | Stripe session, PayPal order/capture, bank transfer proof, free activate, history, refund |
| `notificationAPI` | get all, mark read, mark all read, delete, unread count |
| `messageAPI` | conversations, get/create conversation, messages, send |
| `adminAPI` | dashboard, users, jobs, revenue, reports, system errors, activity logs, bank transfers, invoices, categories CRUD |
| `searchAPI` | global search, saved searches CRUD |
| `categoriesAPI` | categories, job types, career levels, countries, states, cities |
| `uploadAPI` | image upload, file upload, delete |
| `alertsAPI` | CRUD job alerts, toggle status |
| `interviewsAPI` | upcoming interviews |
| `followersAPI` | followed companies |
| `reportsAPI` | submit report |

---

## 📡 Real-time (Socket.io)

Managed via `useSocket` hook (`src/hooks/index.js`). Connects on mount when `accessToken` exists, disconnects on unmount.

```js
// Usage in Messages pages
const socketRef = useSocket()
useEffect(() => {
  socketRef.current?.on('new_message', ({ conversationId }) => {
    qc.invalidateQueries(['messages', conversationId])
  })
}, [])
```

**Events listened:** `notification`, `new_message`, `user_typing`, `user_stopped_typing`, `user_online`, `user_offline`  
**Events emitted:** `join_conversation`, `leave_conversation`, `typing_start`, `typing_stop`

---

## 🏪 State Management

### Zustand Auth Store (`src/store/authStore.js`)

```js
const { user, isAuthenticated, accessToken, refreshToken,
        setAuth, updateUser, logout, setAccessToken } = useAuthStore()
```

Persisted to `localStorage` under key `jp-auth`. Partial state only (no `isLoading`).

### TanStack Query

Global config in `main.jsx`:
- `staleTime`: 5 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

Query keys convention:
```
['jobs', filters]            // job listing
['job', id]                  // single job
['my-applications', params]  // jobseeker apps
['job-applications', jobId]  // employer apps per job
['my-package']               // active package
['notif-count']              // notification badge
['conversations']            // chat list
['messages', conversationId] // chat messages
['admin-dashboard']          // admin stats
```

---

## 🎨 Design System

### Fonts (loaded via Google Fonts in `index.html`)

| Role | Family | Used for |
|------|--------|----------|
| Display | Syne | Page titles, card headings, brand name |
| Body | DM Sans | All body text, labels, UI text |
| Mono | JetBrains Mono | Code, IDs, technical values |

### Color Tokens (Tailwind config)

| Token | Purpose |
|-------|---------|
| `primary-600` (#2563eb) | CTAs, active states, links |
| `dark-900` (#0f172a) | Admin sidebar, dark backgrounds |
| `dark-950` (#080c14) | Page background in dark mode |
| `accent-500` (#f97316) | Highlights, urgent badges |

### Utility Classes (defined in `globals.css`)

```css
.card              /* white card with border-radius and shadow */
.card-hover        /* card with hover translate + shadow transition */
.btn-primary       /* blue filled button */
.btn-secondary     /* gray filled button */
.btn-outline       /* border button */
.btn-danger        /* red filled button */
.btn-ghost         /* no-bg hover button */
.btn-sm / .btn-lg  /* size variants */
.input             /* form input with focus ring */
.input-error       /* red border input */
.label             /* form label */
.badge-*           /* badge variants */
.page-title        /* large bold heading */
.gradient-text     /* blue gradient text (hero) */
.section           /* section with standard vertical padding */
.container-custom  /* max-width centered container */
.animate-fade-in   /* 0.5s fade-in on mount */
.shadow-glow       /* blue glow shadow */
```

---

## 💳 Payment Flows

### Stripe (Credit Card)
1. User clicks plan → `POST /payments/stripe/create-session` → get `sessionUrl`
2. Redirect to Stripe Checkout
3. On success → redirect to `/payment/success?session_id=...`
4. Package auto-activated via webhook on backend
5. Frontend polls `GET /packages/my-package`

### PayPal
1. `POST /payments/paypal/create-order` → `orderId`
2. Show PayPal button (handled in Packages page)
3. On approval → `POST /payments/paypal/capture` with `orderId`
4. Package activates immediately

### Bank Transfer
1. User submits proof via `POST /payments/bank/submit-proof` (multipart)
2. Admin sees it in `/admin/bank-transfers`
3. Admin approves → `PATCH /payments/bank/:invoiceId/approve`
4. Package activates, confirmation email sent

### Free Package
1. `POST /payments/free/activate` with `packageId`
2. Activates immediately

---

## 📦 Package Quota Fields

Shown in active plan cards for both employer and jobseeker:

| Field | Employer | Jobseeker |
|-------|----------|-----------|
| `remainingJobs` | ✅ | — |
| `remainingFeaturedJobs` | ✅ | — |
| `remainingResumeSearch` | ✅ | — |
| `remainingJobApply` | — | ✅ |
| `remainingResumes` | — | ✅ |
| `remainingJobAlerts` | — | ✅ |
| `remainingFeaturedResumes` | — | ✅ |

---

## 🔔 Notifications

`NotificationPanel.jsx` is used inside `Navbar.jsx`:
- Shows unread count badge on bell icon (polled every 30s)
- Dropdown opens on bell click showing last 20 notifications
- Per-notification: mark read (✓), delete (🗑)
- Header: mark all as read button
- Supports all notification types: `application_submitted`, `application_status`, `job_alert`, `payment_success`, `payment_failed`, `package_expiry_warning`, `job_approved`, `job_rejected`, `new_message`

---

## 🧰 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| TailwindCSS | 3 | Styling |
| TanStack Query | 5 | Server state, caching |
| Zustand | 4 | Client state (auth) |
| Framer Motion | 10 | Animations |
| React Router DOM | 6 | Routing |
| Axios | 1.6 | HTTP client |
| React Hook Form | 7 | Form management |
| Socket.io Client | 4 | Real-time |
| Recharts | 2 | Charts (bar, area, pie) |
| Lucide React | 0.294 | Icons |
| date-fns | 3 | Date formatting |
| react-hot-toast | 2 | Toast notifications |
| clsx | 2 | Conditional classNames |

---

## 📜 Available Scripts

```bash
npm run dev        # Start Vite dev server on port 3000
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```

---

## 🔒 Guards and Middleware

### `ProtectedRoute`
Wraps all dashboard routes. Redirects to `/login` with `state.from` if `isAuthenticated` is false. After login, user is redirected back to the intended route.

### `RoleRoute`
Wraps role-specific route groups. Admin and superadmin bypass all role checks. Wrong role → redirect to `/dashboard` → `DashboardRedirect` → correct home.

### `DashboardRedirect`
Smart component at `/dashboard`:
- `employer` → `/employer/dashboard`
- `admin` / `superadmin` → `/admin/dashboard`
- `jobseeker` → `/jobseeker/dashboard`

---

## 🏗️ Adding a New Page

1. Create file in the correct `src/pages/` subdirectory
2. Add lazy import in `App.jsx`
3. Add `<Route>` inside the correct route group
4. If it needs a sidebar link, add to `jobseekerNav` / `employerNav` / `adminNav` in the layout file
5. If it needs a new API call, add the method to the correct export in `api.js`

---

## 📂 Key File Locations Quick Reference

| What you need | File |
|---------------|------|
| Add a new route | `src/App.jsx` |
| Change sidebar nav links | `src/components/layout/DashboardLayout.jsx` or `AdminLayout.jsx` |
| Add a new API endpoint | `src/services/api.js` |
| Global auth state | `src/store/authStore.js` |
| Shared UI component | `src/components/common/UI.jsx` |
| Global CSS classes | `src/styles/globals.css` |
| Tailwind tokens | `tailwind.config.js` |
| Env variables | `.env` (prefix: `VITE_`) |
| Socket connection | `src/hooks/index.js` → `useSocket` |
| Notification bell | `src/components/common/NotificationPanel.jsx` |
| Page loading screen | `src/components/common/PageLoader.jsx` |