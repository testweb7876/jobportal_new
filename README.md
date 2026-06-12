<div align="center">

# 🏢 JobPortal — Full-Stack SaaS Job Platform

**A production-grade job portal built for scale — real-time chat, AI-powered ATS scoring, multi-gateway payments, and role-based dashboards for jobseekers, employers, and admins.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)

[Live Demo](#) · [API Docs](#api-documentation) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📸 Screenshots

> Dashboards · Job Listings · Resume Builder · Real-time Chat · Admin Panel

<!-- Add your screenshots here -->
<div align="center">
<img src="https://placehold.co/900x500/1e293b/94a3b8?text=JobPortal+Dashboard+Preview" width="100%" alt="Dashboard Preview" />
</div>

---

## ✨ Features

### 👔 For Employers
- Post, edit, and manage job listings with rich detail (salary, type, workplace, tags)
- Browse public resumes with ATS scoring and candidate search
- Track applications through a full hiring pipeline
- Real-time chat with candidates via Socket.io
- Company profile with logo, gallery, verification badge
- Subscription plans with job post & resume search quotas
- Analytics dashboard — views, application counts, status breakdowns

### 🎓 For Jobseekers
- Build multiple resumes with ATS completion scoring
- Apply to jobs, track status in real-time, withdraw anytime
- Get matched via customizable job alerts (keyword, category, workplace)
- Shortlist favorite jobs and follow companies
- Share resumes via public links with visibility controls
- Interview schedule tracker with countdown timers

### 🛡️ For Admins
- Full platform oversight — users, jobs, companies, payments
- Job & company moderation (approve / reject with notes)
- Revenue reports by month and payment method
- Bank transfer proof review and approval
- User report resolution system
- Activity logs, system error monitoring, session cleanup

### ⚡ Platform-Wide
- **Real-time** — Socket.io for chat, notifications, typing indicators, online presence
- **Payments** — Stripe Checkout, PayPal, Bank Transfer, and Free plan activation
- **Subscriptions** — Package quotas enforced server-side (jobs, applies, resumes, alerts)
- **Background Jobs** — BullMQ queues for emails and notifications
- **Cron Jobs** — Auto-expire jobs/packages, job alert digests every 6 hours
- **Security** — JWT rotation, Redis blacklist, rate limiting, Helmet, XSS/HPP protection
- **Email** — Welcome, password reset, application updates, payment confirmations
- **Media** — Cloudinary for avatars, logos, galleries, resume files, chat attachments

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, TanStack Query, Zustand, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose (soft delete throughout) |
| **Cache & Queue** | Redis 7, BullMQ |
| **Real-time** | Socket.io |
| **Payments** | Stripe, PayPal REST SDK |
| **Storage** | Cloudinary (streaming upload) |
| **Auth** | JWT (15min access + 7-day refresh rotation), bcryptjs |
| **Email** | Nodemailer via SMTP |
| **Validation** | Joi (backend), React Hook Form (frontend) |
| **Charts** | Recharts (area, bar, pie) |
| **Icons** | Lucide React |
| **Logging** | Winston + daily log rotation |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **DevOps** | Docker, Docker Compose |
| **Monitoring** | Sentry (production) |

---

## 📁 Project Structure

```
jobportal/
├── frontend/                  # React + Vite application
│   └── src/
│       ├── components/        # UI kit, layouts, NotificationPanel
│       ├── pages/             # admin/, auth/, employer/, jobseeker/, public/, payment/
│       ├── services/          # Axios API client with JWT interceptor
│       ├── store/             # Zustand auth store (persisted)
│       ├── hooks/             # useDebounce, useSocket, usePagination, ...
│       └── utils/             # helpers: formatSalary, passwordStrength, ...
│
└── backend/                   # Node.js + Express API
    └── src/
        ├── controllers/       # Auth, Jobs, Applications, Companies, Payments, ...
        ├── models/            # User, Job, Application, Resume, Payment, ...
        ├── routes/            # Modular route files per domain
        ├── services/          # Auth, Cloudinary, Email, Notification
        ├── sockets/           # Socket.io event handlers
        ├── queues/            # BullMQ notification & email queues
        ├── cron/              # 6 scheduled background jobs
        ├── middleware/        # Auth guards, validation, error handler
        └── config/            # DB, Redis, Cloudinary, Swagger, Logger
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB >= 6
- Redis >= 7
- Cloudinary account
- Stripe & PayPal accounts (for payments)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/jobportal.git
cd jobportal
```

### 2. Start Backend

```bash
cd backend
npm install
cp .env.example .env   # Fill in your credentials
docker-compose up -d mongo redis   # or run MongoDB & Redis locally
npm run dev
```

### 3. Start Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on **http://localhost:3000** · Backend on **http://localhost:5000**

---

## 🌍 Environment Variables

<details>
<summary><b>Backend `.env`</b> (click to expand)</summary>

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGO_URI=mongodb://localhost:27017/jobportal

JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=15m

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

REDIS_URL=redis://localhost:6379

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@jobportal.com

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

COOKIE_SECRET=your_cookie_secret
BCRYPT_ROUNDS=12
ENABLE_CRON=true
```
</details>

<details>
<summary><b>Frontend `.env`</b> (click to expand)</summary>

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=JobPortal
VITE_APP_URL=http://localhost:3000
```
</details>

---

## 🗺️ Route Overview

| Area | Routes | Description |
|------|--------|-------------|
| **Public** | `/`, `/jobs`, `/companies`, `/about` | Landing, job listing, company directory |
| **Auth** | `/login`, `/register`, `/reset-password` | Authentication flows |
| **Jobseeker** | `/jobseeker/*` | Dashboard, resumes, applications, alerts, chat |
| **Employer** | `/employer/*` | Post jobs, manage applications, company profile, chat |
| **Admin** | `/admin/*` | Full platform management panel |
| **Payment** | `/payment/success`, `/payment/cancel` | Stripe callback pages |

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`  
**Interactive Docs:** `http://localhost:5000/api-docs` (Swagger UI)

| Domain | Endpoints |
|--------|-----------|
| Auth | Register, Login, Refresh, Logout, Verify Email, Reset Password, Sessions |
| Jobs | CRUD, Shortlist, Featured, Analytics, Moderation |
| Applications | Apply, Status Pipeline, Withdraw, Rate |
| Resumes | Builder CRUD, File Upload, ATS Score, Share Link, Visibility |
| Companies | Profile CRUD, Logo/Gallery, Follow, Verification |
| Payments | Stripe, PayPal, Bank Transfer, Free Activation, History |
| Messages | Conversations, Real-time Messaging, Attachments |
| Notifications | In-app, Mark Read, Unread Count |
| Admin | Users, Revenue, Reports, Logs, Bank Transfers, Invoices |
| Search | Global Search, Saved Searches |

---

## 🔒 Authentication Flow

```
Register / Login
    └── Returns accessToken (15min) + refreshToken (7 days)
        └── Stored in Zustand (persisted) + httpOnly cookies

Every API request
    └── Bearer token via Authorization header
        └── 401 received → auto-refresh → retry request
            └── Refresh fails → clear store → redirect /login
```

**Roles:** `jobseeker` · `employer` · `admin` · `superadmin`

---

## 💳 Payment Flows

```
Stripe  → Create session → Redirect to Checkout → Webhook → Auto-activate
PayPal  → Create order  → Capture approval     → Immediate activation
Bank    → Upload proof  → Admin review          → Manual approval
Free    → One click     → Instant activation
```

---

## ⏰ Background Jobs (Cron)

| Job | Schedule | Action |
|-----|----------|--------|
| Job Expiry | Daily midnight | Expire jobs past deadline |
| Package Expiry | Daily 1am | Deactivate expired plans + notify |
| Package Warning | Daily 1am | Email 3 days before expiry |
| Job Alerts | Every 6 hours | Send matched jobs to subscribers |
| Log Cleanup | Weekly | Delete activity logs older than 90 days |
| Session Cleanup | Daily 2am | Remove expired refresh tokens |

---

## 🐳 Docker

```bash
# Start all services (API + MongoDB + Redis)
docker-compose up -d

# Build production image
npm run docker:build
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm test` | Run tests with coverage |
| `npm run lint` | ESLint check |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ — Full-stack, production-ready, open for contributions**

⭐ Star this repo if you find it useful!

</div>