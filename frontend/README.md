# 🎨 Job Portal Frontend — Vite + React + Tailwind CSS

A production-grade, high-performance frontend for the Job Portal SaaS platform.

## ⚡ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Vite** | Lightning-fast build tool |
| **React 18** | UI framework |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Zustand** | State management |
| **TanStack Query** | Data fetching & caching |
| **React Hook Form** | Form handling |
| **Framer Motion** | Animations |
| **Recharts** | Charts & analytics |
| **Socket.io Client** | Real-time messaging |
| **Lucide React** | Icons |

## 📁 Project Structure

```
src/
├── App.jsx                    # Main router
├── main.jsx                   # Entry point
├── styles/globals.css         # Global styles + Tailwind
├── components/
│   ├── common/
│   │   ├── UI.jsx             # Reusable: Input, Button, Badge, Modal, Table, etc.
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRoute.jsx
│   │   └── PageLoader.jsx
│   └── layout/
│       ├── Navbar.jsx         # Responsive navbar with dark mode
│       ├── Footer.jsx
│       ├── PublicLayout.jsx
│       ├── DashboardLayout.jsx # Sidebar for jobseeker/employer
│       └── AdminLayout.jsx    # Dark admin sidebar
├── pages/
│   ├── public/                # Landing, Jobs, Companies, Job Detail
│   ├── auth/                  # Login, Register, Forgot/Reset Password
│   ├── jobseeker/             # Dashboard, Applications, Profile, etc.
│   ├── employer/              # Dashboard, Post Job, Manage Applications
│   └── admin/                 # Full admin panel
├── services/
│   └── api.js                 # Axios instance + all API helpers
├── store/
│   └── authStore.js           # Zustand auth store with persistence
├── hooks/
│   └── index.js               # useDebounce, useSocket, usePagination, etc.
└── utils/
    └── helpers.js             # Format, validate, date utilities
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit VITE_API_URL to point to your backend

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build
```

## 🌐 Pages & Routes

### Public
- `/` — Hero landing page with job search
- `/jobs` — Job listing with advanced filters
- `/jobs/:id` — Job detail with apply modal
- `/companies` — Company directory
- `/companies/:id` — Company profile

### Auth
- `/login` — Login with JWT
- `/register` — Register as jobseeker or employer
- `/forgot-password` — Password reset flow
- `/verify-email/:token` — Email verification

### Job Seeker (`/jobseeker/*`)
- `dashboard` — Stats, recent apps, recommended jobs
- `applications` — Track all applications with status timeline
- `profile` — Edit profile, upload avatar, social links
- `resumes` — Manage resumes, ATS score
- `shortlisted` — Saved jobs
- `alerts` — Job alert management
- `messages` — Real-time chat
- `settings` — Password, notifications, delete account

### Employer (`/employer/*`)
- `dashboard` — Stats, charts, recent applicants
- `jobs` — Manage job listings
- `jobs/post` — Post new job (full form)
- `jobs/:id/edit` — Edit existing job
- `applications` — Review candidates, update status
- `company` — Company profile, logo, verification
- `packages` — View & purchase subscription plans
- `messages` — Chat with candidates

### Admin (`/admin/*`)
- `dashboard` — Platform-wide analytics
- `users` — User management, suspend/ban
- `jobs` — Job moderation (approve/reject)
- `payments` — Revenue reports
- `reports` — Spam report management

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb)
- **Accent**: Orange (#f97316)
- **Dark bg**: (#0f172a)

### Component Classes
```css
.btn-primary     /* Blue filled button */
.btn-secondary   /* White outlined button */
.btn-outline     /* Primary bordered */
.btn-danger      /* Red button */
.btn-ghost       /* Transparent hover */
.card            /* White card with border */
.card-hover      /* Card with hover effects */
.input           /* Form input */
.badge-primary   /* Blue badge */
.badge-success   /* Green badge */
.badge-warning   /* Amber badge */
.badge-danger    /* Red badge */
.skeleton        /* Loading placeholder */
.gradient-text   /* Blue-to-orange gradient text */
```

## 🔑 Key Features

- ✅ JWT auth with auto refresh token rotation
- ✅ Dark mode (persisted to localStorage)
- ✅ Responsive — mobile first
- ✅ Code splitting with React lazy/Suspense
- ✅ Optimistic UI updates
- ✅ Redis cache-aware data fetching
- ✅ Role-based routing (jobseeker/employer/admin)
- ✅ Real-time notifications via Socket.io
- ✅ File upload with Cloudinary preview
- ✅ Stripe/PayPal payment integration
- ✅ Interactive charts with Recharts
- ✅ Full form validation with react-hook-form

## 🔗 Environment Variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=JobPortal
```
