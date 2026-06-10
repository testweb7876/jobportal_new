# 🚀 Job Portal Backend — Enterprise SaaS API

Production-grade MERN Job Portal backend with full authentication, subscriptions, payments, real-time chat, notifications, AI-ready features, and Cloudinary media management.

---

## 📁 Project Structure

```
src/
├── config/           # DB, Redis, Cloudinary, Logger, Swagger
├── constants/        # Enums & constants
├── controllers/      # Route handlers
│   ├── auth.controller.js
│   ├── job.controller.js
│   ├── company.controller.js
│   ├── application.controller.js
│   ├── payment.controller.js
│   ├── message.controller.js
│   ├── notification.controller.js
│   ├── admin.controller.js
│   └── upload.controller.js
├── cron/             # Scheduled jobs
├── middleware/       # Auth, error handler, validator
├── models/           # MongoDB schemas (mirrors SQL structure)
│   ├── User.model.js
│   ├── Job.model.js
│   ├── Company.model.js
│   ├── Resume.model.js
│   ├── Application.model.js
│   ├── Payment.model.js
│   ├── Message.model.js
│   ├── Notification.model.js
│   ├── RefreshToken.model.js
│   └── Misc.model.js  (Category, JobType, City, Tag, etc.)
├── queues/           # BullMQ background jobs
├── routes/           # Express routers
├── services/         # Business logic layer
│   ├── auth.service.js
│   ├── cloudinary.service.js
│   ├── email.service.js
│   └── notification.service.js
├── sockets/          # Socket.io real-time
├── utils/            # AppError, helpers
├── validators/       # Joi schemas
└── server.js
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start services (MongoDB + Redis)
```bash
docker-compose up -d mongo redis
```

### 4. Run in development
```bash
npm run dev
```

### 5. Production with Docker
```bash
docker-compose up -d
```

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh-token` | Refresh JWT |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/logout-all` | Logout all devices |
| GET  | `/api/v1/auth/verify-email/:token` | Verify email |
| POST | `/api/v1/auth/forgot-password` | Forgot password |
| PATCH| `/api/v1/auth/reset-password/:token` | Reset password |
| PATCH| `/api/v1/auth/change-password` | Change password |
| GET  | `/api/v1/auth/me` | Get current user |
| GET  | `/api/v1/auth/sessions` | Active sessions |

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/jobs` | List all jobs (with filters) |
| GET | `/api/v1/jobs/featured` | Featured jobs |
| GET | `/api/v1/jobs/:id` | Get single job |
| POST | `/api/v1/jobs` | Create job (employer) |
| PATCH | `/api/v1/jobs/:id` | Update job |
| DELETE | `/api/v1/jobs/:id` | Delete job (soft) |
| POST | `/api/v1/jobs/:id/shortlist` | Shortlist toggle |
| PATCH | `/api/v1/jobs/:id/moderate` | Admin moderate |

### Applications
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/applications` | Apply for job |
| GET | `/api/v1/applications/my` | My applications |
| GET | `/api/v1/applications/job/:jobId` | Job applications (employer) |
| PATCH | `/api/v1/applications/:id/status` | Update status |
| PATCH | `/api/v1/applications/:id/withdraw` | Withdraw |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/payments/stripe/create-session` | Create Stripe session |
| POST | `/api/v1/payments/stripe/webhook` | Stripe webhook |
| POST | `/api/v1/payments/paypal/create-order` | Create PayPal order |
| POST | `/api/v1/payments/paypal/capture` | Capture PayPal payment |
| POST | `/api/v1/payments/bank/submit-proof` | Submit bank proof |
| GET | `/api/v1/payments/history` | Payment history |

### Companies
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/companies` | List companies |
| GET | `/api/v1/companies/:id` | Company detail |
| POST | `/api/v1/companies` | Create company |
| POST | `/api/v1/companies/logo` | Upload logo |
| POST | `/api/v1/companies/:id/follow` | Follow/unfollow |
| POST | `/api/v1/companies/verify/submit` | Submit verification |

### Messages
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/messages/conversations` | List conversations |
| POST | `/api/v1/messages/conversations` | Start conversation |
| GET | `/api/v1/messages/conversations/:id` | Get messages |
| POST | `/api/v1/messages/conversations/:id` | Send message |

### Uploads
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/uploads/image` | Upload image |
| POST | `/api/v1/uploads/file` | Upload file |
| POST | `/api/v1/uploads/multiple` | Upload multiple |
| DELETE | `/api/v1/uploads/delete/:publicId` | Delete file |

---

## 🔒 Security Features

- ✅ JWT access + refresh token rotation
- ✅ Refresh token blacklisting (Redis)
- ✅ Rate limiting (global + auth-specific)
- ✅ Helmet security headers
- ✅ MongoDB sanitization
- ✅ XSS protection
- ✅ HPP (HTTP Parameter Pollution) protection
- ✅ CORS whitelist
- ✅ Input validation (Joi)
- ✅ Password strength enforcement
- ✅ Device/session tracking
- ✅ IP logging
- ✅ Soft delete (never hard delete critical data)

---

## 💳 Payment Gateways

| Gateway | Features |
|---------|----------|
| **Stripe** | Checkout session, webhooks, auto package activation |
| **PayPal** | Create order, capture, sandbox/live |
| **Bank Transfer** | Proof upload (Cloudinary), admin approval |

---

## 📡 Real-time Features (Socket.io)

- New message notifications
- Typing indicators
- Online/offline status
- Live notification delivery

---

## 🔁 Background Jobs (BullMQ + Redis)

- Email notifications
- Job alert emails (every 6 hours)

## ⏰ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Job Expiry | Daily midnight | Auto-expire old jobs |
| Package Expiry | 1am daily | Deactivate expired packages + warnings |
| Job Alerts | Every 6 hours | Send matching jobs to alert subscribers |
| Log Cleanup | Weekly Sunday | Remove 90-day old activity logs |
| Session Cleanup | 2am daily | Remove expired refresh tokens |

---

## ☁️ Cloudinary Folders

```
jobportal/
├── users/          # Profile avatars
├── companies/      # Company logos
├── resumes/        # Resume PDF files
├── messages/       # Chat attachments
├── verifications/  # Company verification docs
└── gallery/        # Company gallery images
```

---

## 📚 API Documentation

Swagger UI available at: `http://localhost:5000/api-docs`

---

## 🧪 Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js + Express | API server |
| MongoDB + Mongoose | Database |
| Redis | Caching + token blacklist |
| BullMQ | Job queues |
| Socket.io | Real-time |
| Cloudinary | Media storage |
| Stripe + PayPal | Payments |
| Nodemailer | Emails |
| Winston | Logging |
| Joi | Validation |
| Swagger | API docs |
| Docker | Containerization |
| Sentry | Error monitoring |

---

## 🌍 Environment Variables

See `.env.example` for complete configuration.

---

## 👨‍💻 Development

```bash
npm run dev      # Start with nodemon
npm test         # Run tests
npm run lint     # ESLint
```
