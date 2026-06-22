# 🚀 Job Portal Backend — Enterprise SaaS API

Production-grade Node.js + Express + MongoDB Job Portal backend with full authentication (including Google & LinkedIn OAuth), subscriptions, payments (Stripe, PayPal, Bank), real-time chat via Socket.io, push/email notifications, cron jobs, Cloudinary media, Redis caching, BullMQ queues, and Swagger API docs.

---

## 📁 Project Structure

```
src/
├── config/
│   ├── cloudinary.js         # Cloudinary v2 SDK setup
│   ├── database.js           # MongoDB connection with reconnect logic
│   ├── logger.js             # Winston logger with daily rotate files
│   ├── passport.js           # Passport strategies: Google OAuth2, LinkedIn OpenID Connect
│   ├── redis.js              # Redis client + cache helper (get/set/del/delPattern/exists)
│   └── swagger.js            # Swagger/OpenAPI 3.0 spec config
├── constants/
│   └── index.js              # Enums: USER_ROLES, JOB_STATUS, APPLICATION_STATUS, PAYMENT_*, NOTIFICATION_TYPES, etc.
├── controllers/
│   ├── admin.controller.js           # Dashboard, user mgmt, revenue reports, reports, system errors, activity logs, invoices
│   ├── application.controller.js     # Apply, get my/job/single applications, update status, withdraw, rate, company overview
│   ├── auth.controller.js            # Register, login, refresh, logout, verify email, forgot/reset/change password, sessions, OAuth callbacks
│   ├── company.controller.js         # CRUD companies, logo/gallery upload, verification, follow/unfollow, admin panel
│   ├── job.controller.js             # CRUD jobs, shortlist, featured, moderate (admin), analytics
│   ├── jobAlert.controller.js        # CRUD job alerts for jobseekers
│   ├── message.controller.js         # Conversations, messages, send with attachments, delete
│   ├── notification.controller.js    # Get, mark read, mark all read, delete notifications
│   ├── payment.controller.js         # Stripe session/webhook, PayPal order/capture, bank transfer, free package, refund
│   └── upload.controller.js          # Generic image/file/multiple upload + delete via Cloudinary
├── cron/
│   └── index.js              # 5 cron jobs: job expiry, package expiry + warnings, job alerts, log cleanup, session cleanup
├── middleware/
│   ├── auth.middleware.js     # protect, optionalAuth, restrictTo, employerOnly, jobseekerOnly, adminOnly, verifiedOnly, authLimiter
│   ├── errorHandler.js        # Global error handler: CastError, duplicate key, validation, JWT errors
│   └── validate.middleware.js # Joi schema validation middleware
├── models/
│   ├── Application.model.js  # Job applications with status history, interview details, resume snapshot
│   ├── Company.model.js       # Company profile, gallery, verification docs, social links, slug
│   ├── Job.model.js           # Jobs with full classification, salary, location, analytics, featured/gold
│   ├── Message.model.js       # Conversations + Messages with attachments, read receipts, soft delete
│   ├── Misc.model.js          # Category, JobType, CareerLevel, Education, Currency, Country, State, City, Department, CoverLetter, JobAlert, JobShortlist, ActivityLog, Tag, Follower, Report, SavedSearch, Folder, SystemError
│   ├── Notification.model.js  # Notifications with type, channels (inApp/email/push/sms), refModel
│   ├── Package.model.js       # Subscription packages with feature quotas, duration, discount, Stripe/PayPal plan
│   ├── Payment.model.js       # UserPackage (quotas), Invoice (Stripe/PayPal/bank/free), TransactionLog, Subscription
│   ├── RefreshToken.model.js  # Refresh tokens with device info, TTL index, revoke support
│   ├── Resume.model.js        # Resume with education, experience, languages, files, ATS score, share token
│   └── User.model.js          # Users with roles, status, avatar, job preferences, social links, notification settings, device history, googleId, linkedinId
├── queues/
│   └── index.js              # BullMQ: notification queue (sends actual emails via emailService), email queue (job alerts)
├── routes/
│   ├── admin.routes.js        # /admin/* — all admin-only routes
│   ├── analytics.routes.js    # /analytics/employer, /analytics/jobseeker
│   ├── application.routes.js  # /applications/*
│   ├── auth.routes.js         # /auth/* — includes Google & LinkedIn OAuth routes
│   ├── category.routes.js     # /categories, /job-types, /career-levels, /education, /countries, /states, /cities + admin CRUD
│   ├── company.routes.js      # /companies/*
│   ├── follower.routes.js     # /followers/following
│   ├── interview.routes.js    # /interviews — upcoming interviews for employer/jobseeker
│   ├── job.routes.js          # /jobs/*
│   ├── jobAlert.routes.js     # /job-alerts/*
│   ├── message.routes.js      # /messages/conversations/*
│   ├── notification.routes.js # /notifications/*
│   ├── package.routes.js      # /packages/* + admin CRUD
│   ├── payment.routes.js      # /payments/* (Stripe webhook uses raw body)
│   ├── report.routes.js       # /reports — submit report
│   ├── resume.routes.js       # /resumes/* — full resume management
│   ├── search.routes.js       # /search — global search (jobs/companies/resumes) + saved searches
│   ├── upload.routes.js       # /uploads/*
│   └── user.routes.js         # /users/profile, avatar, notification settings, account delete, resume upload
├── services/
│   ├── auth.service.js        # Token generation/rotation, sendTokenResponse, revokeToken, revokeAll
│   ├── cloudinary.service.js  # Multer memory storage, uploadToCloudinary, deleteFromCloudinary, responsive URLs
│   ├── email.service.js       # Nodemailer: 15 templates — welcome, password reset/change alert, application confirmation/status/new-alert, job moderation, company verification, account status, payment confirmed/failed/refund/bank-proof, package expiry, job alerts, generic notification
│   └── notification.service.js# NotificationService: create (with socket emit + BullMQ queue), markRead, markAllRead, getUnreadCount
├── sockets/
│   └── index.js              # Socket.io: auth middleware, personal rooms, conversation rooms, typing indicators, online/offline
├── utils/
│   └── AppError.js           # AppError class, asyncHandler, sendSuccess, sendPaginated
├── validators/
│   └── auth.validator.js     # Joi schemas: register, login, forgotPassword, resetPassword, changePassword
└── server.js                 # Express app: security middleware, CORS, rate limiting, Passport, routes, Socket.io, cron, queues
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB >= 6
- Redis >= 7
- Cloudinary account
- Stripe account (for payments)
- Google OAuth credentials (for Google login)
- LinkedIn OAuth credentials (for LinkedIn login)

### 1. Clone & Install
```bash
git clone <repo-url>
cd job-portal-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Start Services (MongoDB + Redis via Docker)
```bash
docker-compose up -d mongo redis
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Production with Docker
```bash
docker-compose up -d
```

### 6. Test Stripe Webhooks Locally
```bash
stripe login
stripe listen --forward-to localhost:5000/api/v1/payments/stripe/webhook
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm test` | Run Jest tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Start all services via Docker Compose |

---

## 🔑 API Reference

**Base URL:** `http://localhost:5000/api/v1`  
**Swagger Docs:** `http://localhost:5000/api-docs`  
**Health Check:** `GET http://localhost:5000/health`

---

### 🔐 Auth — `/api/v1/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | ❌ | Register new user (jobseeker or employer) |
| POST | `/login` | ❌ | Login — returns accessToken + refreshToken |
| POST | `/refresh-token` | ❌ | Rotate refresh token, get new access token |
| POST | `/logout` | ✅ | Revoke current session |
| POST | `/logout-all` | ✅ | Revoke all active sessions across all devices |
| GET | `/verify-email/:token` | ❌ | Verify email address |
| POST | `/resend-verification` | ❌ | Resend email verification link |
| POST | `/forgot-password` | ❌ | Send password reset link |
| PATCH | `/reset-password/:token` | ❌ | Reset password with token |
| PATCH | `/change-password` | ✅ | Change password (requires current password) |
| GET | `/me` | ✅ | Get current authenticated user |
| GET | `/sessions` | ✅ | List all active sessions/devices (sorted newest first) |
| DELETE | `/sessions/:sessionId` | ✅ | Revoke a specific session |
| GET | `/google` | ❌ | Initiate Google OAuth login |
| GET | `/google/callback` | ❌ | Google OAuth callback — issues JWT, redirects to frontend |
| GET | `/linkedin` | ❌ | Initiate LinkedIn OAuth login |
| GET | `/linkedin/callback` | ❌ | LinkedIn OAuth callback — issues JWT, redirects to frontend |

> Auth uses **JWT Bearer tokens** (`Authorization: Bearer <token>`). Tokens are also set as signed `httpOnly` cookies (`accessToken`, `refreshToken`).
>
> OAuth callbacks redirect to `CLIENT_URL/oauth-callback#accessToken=...&refreshToken=...` — tokens are passed in the URL **fragment** (not query string) to prevent them from appearing in server logs or Referer headers.

---

### 👤 User — `/api/v1/users`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/profile` | ✅ | Get own profile |
| PATCH | `/profile` | ✅ | Update profile (name, bio, skills, job preferences, social links, etc.) |
| POST | `/avatar` | ✅ | Upload profile avatar (multipart/form-data, field: `avatar`) |
| PATCH | `/notification-settings` | ✅ | Update notification preferences |
| DELETE | `/account` | ✅ | Soft delete own account |
| POST | `/resume` | ✅ | Upload quick resume file (multipart/form-data, field: `resume`) |

---

### 💼 Jobs — `/api/v1/jobs`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Optional | List all approved jobs (filters: keyword, category, jobType, city, country, workplaceType, salaryMin/Max, experience, isUrgent, company, tags, sort) |
| GET | `/featured` | ❌ | Get featured jobs |
| GET | `/my-jobs` | ✅ Employer | Get own posted jobs |
| GET | `/shortlisted` | ✅ | Get shortlisted jobs |
| GET | `/:id` | Optional | Get single job by ID or slug |
| GET | `/:id/analytics` | ✅ Employer | Views, application count, status breakdown |
| POST | `/` | ✅ Employer | Create a job (requires active package) |
| PATCH | `/:id` | ✅ | Update job (employer: own jobs only; admin: any) |
| DELETE | `/:id` | ✅ | Soft delete job |
| POST | `/:id/shortlist` | ✅ | Toggle shortlist a job |
| PATCH | `/:id/moderate` | ✅ Admin | Approve / reject / pause a job (emails employer the result) |

**Job Filters (Query Params):**
```
keyword, category, subcategory, jobType, city, country, workplaceType,
isUrgent, company, experience, tags, salaryMin, salaryMax,
sort (newest|oldest|salary_high|salary_low|relevance),
page, limit
```

---

### 📋 Applications — `/api/v1/applications`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | ✅ Jobseeker | Apply for a job (requires active package with remaining applies) |
| GET | `/my` | ✅ Jobseeker | My applications (filter by status) |
| GET | `/company-overview` | ✅ Employer | Stats + recent applications for all company jobs |
| GET | `/job/:jobId` | ✅ Employer | All applications for a specific job (filter by status, rating) |
| GET | `/:id` | ✅ | Single application detail |
| PATCH | `/:id/status` | ✅ Employer | Update status: reviewed, shortlisted, interview_scheduled, interviewed, offered, hired, rejected |
| PATCH | `/:id/withdraw` | ✅ Jobseeker | Withdraw application |
| PATCH | `/:id/rate` | ✅ Employer | Rate a candidate (0–5) |

**Application Status Flow:**
```
applied → reviewed → shortlisted → interview_scheduled → interviewed → offered → hired
                                                                              ↘ rejected
```

---

### 🏢 Companies — `/api/v1/companies`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Optional | List all companies (filters: keyword, city, verified, sort) |
| GET | `/my-company` | ✅ Employer | Get own company |
| GET | `/:id` | Optional | Get company by ID or slug (includes recent jobs). Accepts both ObjectId and slug. |
| POST | `/` | ✅ Employer | Create company profile |
| PATCH | `/:id` | ✅ | Update company |
| POST | `/logo` | ✅ Employer | Upload logo (multipart/form-data, field: `logo`) |
| POST | `/gallery` | ✅ Employer | Upload gallery image (field: `image`) |
| DELETE | `/gallery` | ✅ Employer | Delete gallery image (body: `publicId`) |
| POST | `/verify/submit` | ✅ Employer | Submit verification documents (field: `documents`, max 5) |
| POST | `/:id/follow` | ✅ | Follow / unfollow company. Accepts both ObjectId and slug. |
| PATCH | `/:id/verify` | ✅ Admin | Approve or reject company verification (emails employer) |
| GET | `/admin/all` | ✅ Admin | List all companies with filters |

---

### 📄 Resumes — `/api/v1/resumes`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ✅ Employer | Search public resumes |
| GET | `/my` | ✅ Jobseeker | Get own resumes |
| GET | `/share/:token` | ❌ | Get resume via share token |
| GET | `/:id` | Optional | Single resume (respects visibility) |
| POST | `/` | ✅ Jobseeker | Create resume (requires active package) |
| PATCH | `/:id` | ✅ | Update resume (auto-calculates completion %) |
| DELETE | `/:id` | ✅ | Soft delete resume |
| POST | `/:id/upload` | ✅ | Upload resume file (field: `file`) |
| DELETE | `/:id/files/:publicId` | ✅ | Delete a resume file |
| PATCH | `/:id/visibility` | ✅ | Toggle visibility (public/private/restricted) + searchable |
| POST | `/:id/share` | ✅ | Generate shareable link |
| PATCH | `/:id/feature` | ✅ | Toggle featured status |

---

### 💬 Messages — `/api/v1/messages`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/conversations` | ✅ | List all conversations |
| POST | `/conversations` | ✅ | Start or get existing conversation (body: `recipientId`, optional `jobId`) |
| GET | `/conversations/:conversationId` | ✅ | Get paginated messages (marks unread as read) |
| POST | `/conversations/:conversationId` | ✅ | Send message with optional attachments (field: `attachments`, max 5) |
| DELETE | `/:messageId` | ✅ | Delete message (body: `deleteForEveryone: true/false`) |

---

### 🔔 Notifications — `/api/v1/notifications`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ✅ | Get notifications (filter: `unread=true`) |
| GET | `/unread-count` | ✅ | Get unread notification count |
| PATCH | `/read-all` | ✅ | Mark all as read |
| PATCH | `/:id/read` | ✅ | Mark single notification as read |
| DELETE | `/:id` | ✅ | Delete notification |

---

### 💳 Payments — `/api/v1/payments`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/stripe/create-session` | ✅ | Create Stripe Checkout session (body: `packageId`) |
| POST | `/stripe/webhook` | ❌ | Stripe webhook — auto-activates package on payment success, emails user on failure |
| POST | `/paypal/create-order` | ✅ | Create PayPal order (body: `packageId`) |
| POST | `/paypal/capture` | ✅ | Capture PayPal payment (body: `orderId`) — sends confirmation email |
| POST | `/bank/submit-proof` | ✅ | Submit bank transfer proof (multipart, field: `proof`, body: `packageId`) — sends receipt email |
| PATCH | `/bank/:invoiceId/approve` | ✅ Admin | Approve bank transfer + activate package |
| PATCH | `/bank/:invoiceId/status` | ✅ Admin | Update bank transfer status (pending/paid/rejected/failed) |
| GET | `/bank-transfers` | ✅ Admin | All bank transfer invoices |
| POST | `/free/activate` | ✅ | Activate free package |
| GET | `/history` | ✅ | Payment history (paginated) |
| POST | `/:id/refund` | ✅ | Request refund for a paid invoice (sends confirmation email) |

---

### 📦 Packages — `/api/v1/packages`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | List all active packages (filter: `for=employer|jobseeker`) |
| GET | `/my-package` | ✅ | Get user's currently active package with quotas |
| GET | `/:id` | ❌ | Get single package |
| POST | `/` | ✅ Admin | Create package |
| PATCH | `/:id` | ✅ Admin | Update package |
| DELETE | `/:id` | ✅ Admin | Deactivate package |

---

### 🔍 Search — `/api/v1/search`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Optional | Global search (params: `q`, `type=jobs|companies|resumes`, `page`, `limit`) |
| GET | `/saved` | ✅ | Get saved searches |
| POST | `/saved` | ✅ | Save a search |
| DELETE | `/saved/:id` | ✅ | Delete saved search |

---

### 📊 Analytics — `/api/v1/analytics`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/employer` | ✅ Employer | Total jobs, applications, status breakdown, top jobs by views |
| GET | `/jobseeker` | ✅ | Total applications, status breakdown, profile views |

---

### 🛡️ Admin — `/api/v1/admin`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Stats: users, jobs, companies, applications, revenue, pending reports |
| GET | `/users` | List all users (filters: role, status, search) |
| PATCH | `/users/:id/status` | Update user status (active/suspended/banned/pending) — emails user |
| DELETE | `/users/:id` | Soft delete user |
| GET | `/jobs` | List all jobs including deleted |
| GET | `/revenue` | Revenue report by month + by payment method |
| GET | `/reports` | User-submitted reports |
| PATCH | `/reports/:id` | Resolve a report |
| GET | `/system-errors` | Unread system errors (auto-marks as viewed) |
| GET | `/activity-logs` | Activity logs (filter by uid) |
| GET | `/bank-transfers` | Pending bank transfer invoices |
| GET | `/invoices` | All invoices (filter by paymentStatus, payMethod) |
| GET | `/settings/bank` | Get bank account details |
| PATCH | `/settings/bank` | Update bank account details |

---

### 📂 Other Routes

| Prefix | Description |
|--------|-------------|
| `/api/v1/categories` | Categories, job types, career levels, education, currencies, countries, states, cities |
| `/api/v1/job-alerts` | CRUD job alerts (GET, POST, PATCH, DELETE) |
| `/api/v1/uploads` | Generic file upload (image / file / multiple) + delete |
| `/api/v1/interviews` | Upcoming interview_scheduled applications for employer or jobseeker |
| `/api/v1/followers` | GET `/following` — companies the user follows |
| `/api/v1/reports` | POST — submit a report about a job/company/resume/user |

---

## 🔒 Authentication & Authorization

Tokens are passed as:
1. `Authorization: Bearer <accessToken>` header, **or**
2. Signed `accessToken` cookie

| Role | Permissions |
|------|-------------|
| `jobseeker` | Apply, manage resumes, view jobs, messages |
| `employer` | Post jobs, view applications, manage company |
| `admin` | All of the above + moderate content, manage users |
| `superadmin` | Full access |

---

## 🌐 Social Login (Google & LinkedIn)

OAuth login is handled entirely on the backend using Passport.js. No OAuth SDK is needed on the frontend.

### Flow
```
1. Frontend links to GET /api/v1/auth/google  (or /auth/linkedin)
2. Browser redirects to Google/LinkedIn consent screen
3. User approves → provider redirects to callback URL
4. Backend finds or creates the user (links to existing account by email)
5. Backend issues JWT access + refresh tokens
6. Redirects to: CLIENT_URL/oauth-callback#accessToken=...&refreshToken=...
7. Frontend reads tokens from URL fragment and completes login
```

Tokens arrive in the **URL fragment** (`#`), not the query string (`?`). This prevents them from appearing in server access logs, proxy logs, or browser Referer headers on subsequent navigation.

### Account Linking
If a user with the same email already exists (registered via password), their Google/LinkedIn ID is automatically linked to that account — they can then log in via either method without creating a duplicate account.

### Google Console Setup
1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → OAuth consent screen → External
3. Credentials → Create → OAuth client ID → Web application
4. Authorized redirect URIs: `http://localhost:5000/api/v1/auth/google/callback`
5. Copy Client ID and Secret to `.env`

### LinkedIn Developer Setup
1. [linkedin.com/developers](https://www.linkedin.com/developers) → Create App
2. Auth tab → OAuth 2.0 scopes: `openid`, `profile`, `email`
3. Authorized redirect URLs: `http://localhost:5000/api/v1/auth/linkedin/callback`
4. Copy Client ID and Secret to `.env`

> **LinkedIn Note:** LinkedIn's old v2 API was deprecated in 2023. This implementation uses LinkedIn's current OpenID Connect endpoint (`/v2/userinfo`) via `passport-oauth2` — the old `passport-linkedin-oauth2` package targets the deprecated API and should not be used.

---

## 📧 Email Notifications

All transactional emails are sent via Nodemailer (`src/services/email.service.js`). The following emails are sent automatically:

| Trigger | Template | Recipient |
|---------|----------|-----------|
| Register | Welcome + verify email link | New user |
| Resend verification | Welcome + new verify link | User |
| Email verified | — (silent) | — |
| Forgot password | Reset link (1hr expiry) | User |
| Password reset/change | Security alert | User |
| Account suspended/banned/reactivated | Status notification | User |
| Job application submitted | Confirmation | Jobseeker |
| New job application received | Alert | Employer |
| Application status updated | Status update | Jobseeker |
| Job approved/rejected/paused (admin) | Moderation result | Employer |
| Company verification approved/rejected | Verification result | Employer |
| Payment confirmed | Invoice confirmation | User |
| Payment failed | Failure notice | User |
| Refund requested | Confirmation | User |
| Bank proof submitted | Receipt acknowledgement | User |
| Package expiring in 3 days | Expiry warning | User |
| Job alert match | Matching jobs digest | Jobseeker |
| Generic notification (via BullMQ queue) | Notification title/message | User |

### BullMQ Email Queue
The notification queue worker (`src/queues/index.js`) actually sends emails when `channels.email: true` is set on a notification — previously this was a no-op (only set a flag). The email queue handles batch job-alert delivery.

---

## 📡 Real-time (Socket.io)

Connect to `ws://localhost:5000` with auth token:
```js
const socket = io('http://localhost:5000', {
  auth: { token: '<accessToken>' }
});
```

**Events to Listen:**
| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `Notification` object | New in-app notification |
| `new_message` | `{ conversationId, message }` | New chat message |
| `user_typing` | `{ userId, conversationId }` | Someone is typing |
| `user_stopped_typing` | `{ userId, conversationId }` | Stopped typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |

**Events to Emit:**
| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `conversationId` | Join a chat room |
| `leave_conversation` | `conversationId` | Leave a chat room |
| `typing_start` | `{ conversationId }` | Start typing |
| `typing_stop` | `{ conversationId }` | Stop typing |

---

## ⏰ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Job Expiry | Daily midnight | Auto-expire approved jobs past `expiresAt` |
| Package Expiry | Daily 1am | Deactivate expired packages + send notification |
| Package Warning | Daily 1am | Email warning 3 days before expiry |
| Job Alerts | Every 6 hours | Send matching new jobs to alert subscribers |
| Log Cleanup | Weekly Sunday 3am | Delete activity logs older than 90 days |
| Session Cleanup | Daily 2am | Delete expired refresh tokens from DB |

---

## ☁️ Cloudinary Folders

```
jobportal/
├── users/          → Profile avatars
├── companies/      → Company logos
├── resumes/        → Resume PDF/DOCX files
├── messages/       → Chat message attachments
├── verifications/  → Company verification documents + bank transfer proofs
├── gallery/        → Company gallery images
└── covers/         → Cover images
```

---

## 💳 Payment Flows

### Stripe
1. Frontend calls `POST /payments/stripe/create-session` → gets `sessionUrl`
2. Redirect user to `sessionUrl` (Stripe Checkout)
3. On success, Stripe calls webhook → package auto-activates + confirmation email sent
4. On failure, Stripe webhook updates invoice status + failure email sent
5. Frontend polls `GET /packages/my-package` or listens for `payment_success` notification

### PayPal
1. `POST /payments/paypal/create-order` → get `orderId`
2. Show PayPal button using SDK with `orderId`
3. On approval, call `POST /payments/paypal/capture` with `orderId`
4. Package activates immediately + confirmation email sent

### Bank Transfer
1. User uploads proof via `POST /payments/bank/submit-proof` → receipt email sent to user
2. Admin reviews at `GET /admin/bank-transfers`
3. Admin approves via `PATCH /payments/bank/:invoiceId/approve` OR `PATCH /payments/bank/:invoiceId/status`
4. Package activates + confirmation email sent

### Free Package
1. `POST /payments/free/activate` with `packageId`
2. Activates immediately

---

## 📦 Package Quotas (UserPackage fields)

When a package is activated, these counters are populated and decremented on use:

| Field | Used When |
|-------|-----------|
| `remainingJobs` | Employer creates a job |
| `remainingJobApply` | Jobseeker applies for a job |
| `remainingResumes` | Jobseeker creates a resume |
| `remainingFeaturedJobs` | Employer features a job |
| `remainingFeaturedResumes` | Resume is featured |
| `remainingResumeSearch` | Employer searches resumes |
| `remainingJobAlerts` | Jobseeker creates a job alert |

---

## 🔒 Security Features

- JWT access tokens (15 min) + refresh token rotation (7 days)
- Redis blacklist for revoked access tokens
- Rate limiting: 100 req/15min global, 5 req/15min on auth routes
- Slow-down after 50 requests (adds 500ms delay)
- Helmet security headers
- MongoDB sanitization (`express-mongo-sanitize`)
- XSS protection (`xss-clean`)
- HTTP Parameter Pollution prevention (`hpp`)
- CORS whitelist via `CLIENT_URL` env variable
- Joi input validation on all auth routes
- Bcrypt password hashing (12 rounds)
- Soft delete — critical data is never hard-deleted
- Signed cookies (cookie-parser)
- Device/session tracking with IP + User-Agent logging
- OAuth tokens passed via URL fragment (not query string) to prevent log exposure
- Email verification tokens preserved on send-failure so resend always works
- Password change revokes all existing refresh tokens across all devices
- Token rotation attack detection — revokes all user sessions on reuse attempt

---

## 🌍 Environment Variables

```env
# SERVER
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
API_VERSION=v1

# MONGODB
MONGO_URI=mongodb://localhost:27017/jobportal
MONGO_URI_PROD=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jobportal

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=15m

# CLOUDINARY
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# REDIS
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# EMAIL (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@jobportal.com
EMAIL_FROM_NAME=JobPortal

# STRIPE
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# PAYPAL
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# LINKEDIN OAUTH
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# SENTRY (production only)
SENTRY_DSN=https://your_sentry_dsn

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# BCRYPT
BCRYPT_ROUNDS=12

# COOKIES
COOKIE_SECRET=your_cookie_secret
COOKIE_EXPIRES_DAYS=7

# UPLOAD LIMITS (bytes)
MAX_FILE_SIZE=10485760
MAX_IMAGE_SIZE=5242880

# CRON
ENABLE_CRON=true
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | API server |
| **MongoDB + Mongoose** | Primary database with soft delete |
| **Redis** | Caching, token blacklist, BullMQ backend |
| **BullMQ** | Background job queues (emails, notifications) |
| **Socket.io** | Real-time chat, notifications, presence |
| **Passport.js** | OAuth strategies: Google OAuth2, LinkedIn OpenID Connect |
| **Cloudinary** | Image & file storage (stream upload) |
| **Stripe** | Card payments + webhook |
| **PayPal** | PayPal checkout (sandbox + live) |
| **Nodemailer** | Transactional emails via SMTP (15 templates) |
| **Winston** | Structured logging with daily log rotation |
| **Joi** | Request body validation |
| **Swagger** | Auto-generated API documentation |
| **node-cron** | Scheduled background tasks |
| **Helmet / hpp / xss-clean** | Security hardening |
| **express-rate-limit** | API rate limiting |
| **JWT + bcryptjs** | Auth + password hashing |
| **Docker** | Containerization |
| **Sentry** | Error monitoring (production) |

---

## 🎨 Frontend Integration Guide

### Headers to send with every request:
```js
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Standard API Response format:
```json
// Success (single)
{
  "success": true,
  "message": "...",
  "user": { ... }
}

// Success (paginated)
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

### Token refresh flow:
```js
// If 401 is received, call refresh endpoint
POST /api/v1/auth/refresh-token
Body: { "refreshToken": "<token>" }

// Response
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### OAuth login flow (frontend side):
```js
// 1. Link or redirect to the OAuth URL — no JS needed
window.location.href = `${API_URL}/auth/google`

// 2. After Google/LinkedIn approves, the backend redirects to:
//    /oauth-callback#accessToken=...&refreshToken=...

// 3. On the OAuthCallbackPage, parse the fragment:
const hash = window.location.hash.replace(/^#/, '')
const params = new URLSearchParams(hash)
const accessToken = params.get('accessToken')
const refreshToken = params.get('refreshToken')

// 4. Fetch the user profile and complete login
const { data } = await authAPI.getMe()
setAuth(data.user, accessToken, refreshToken)
```

### File upload example (multipart):
```js
const formData = new FormData();
formData.append('avatar', file);

fetch('/api/v1/users/avatar', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData  // Do NOT set Content-Type manually
});
```

---

## 📚 API Documentation

Interactive Swagger UI: `http://localhost:5000/api-docs`