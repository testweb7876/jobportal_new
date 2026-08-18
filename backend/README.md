# Job Portal — Backend Documentation

Complete reference for the MERN Job Portal backend (Node.js + Express + MongoDB).
This document is written so a **frontend developer** can build the entire UI without reading the backend source code — every route, request/response shape, auth rule, and real-time event is listed here.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 4 |
| Database | MongoDB + Mongoose |
| Cache / Queue | Redis (`ioredis`/`redis`) + BullMQ |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens), Passport (Google & LinkedIn OAuth) |
| File Storage | Cloudinary |
| Payments | Stripe, PayPal, Manual Bank Transfer |
| Email | Nodemailer (SMTP) |
| Scheduled Jobs | node-cron |
| Validation | Joi |
| Logging | Winston (daily rotate) |
| Docs | Swagger (`/api-docs`) |
| Error Tracking | Sentry (production) |

**Base URL:** `http://localhost:5000/api/v1` (configurable via `API_VERSION` env var)

---

## 2. Authentication Model

- **Access Token**: JWT, short-lived (default 15 min), sent as `Authorization: Bearer <token>` OR as an httpOnly signed cookie `accessToken`.
- **Refresh Token**: opaque UUID+random string, 7-day expiry, stored in DB (`RefreshToken` collection) for rotation/revocation, sent as cookie `refreshToken` or in request body.
- **Token rotation**: every `/auth/refresh-token` call revokes the old refresh token and issues a new access+refresh pair. Reuse of an already-rotated token revokes **all** sessions for that user (anti-theft).
- **Blacklisting**: on logout, the access token is blacklisted in Redis until its natural expiry.
- **OAuth**: Google and LinkedIn login redirect flows — on success the backend redirects to:
  `${CLIENT_URL}/oauth-callback#accessToken=...&refreshToken=...`
  The frontend must read tokens from the URL hash on that page.

### Roles
`jobseeker` | `employer` | `admin` | `superadmin`

- `admin` — can NOT see/modify other `admin`/`superadmin` accounts, and only has access to whichever `permissions` array is granted (see below).
- `superadmin` — full access, only one conceptually, manages admin permissions.
- **Admin permissions** (assignable per-admin): `revenue`, `analytics`, `packages`, `categories`, `refunds`, `broadcast`.

### Account status
`pending` (unverified email, must verify before login) → `active` → `suspended` / `banned` (login blocked, contact support).

---

## 3. Environment Variables (`.env`)

```
NODE_ENV, PORT, CLIENT_URL, API_VERSION
MONGO_URI, MONGO_URI_PROD
JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_URL
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE
SENTRY_DSN
RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX
BCRYPT_ROUNDS
COOKIE_SECRET, COOKIE_EXPIRES_DAYS
MAX_FILE_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES
ENABLE_CRON
ADMIN_EMAIL, ADMIN_SECRET_KEY
```

The frontend only needs: `STRIPE_PUBLISHABLE_KEY` (for Stripe Elements/Checkout) and the API base URL.

---

## 4. Standard Response Shapes

**Success (single item):**
```json
{ "success": true, "message": "...", "job": { ... } }
```
*(the key name varies by route — e.g. `user`, `job`, `company`, `application`, etc. — see each endpoint below)*

**Success (paginated list):**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": { "total": 120, "page": 1, "limit": 20, "pages": 6, "hasMore": true }
}
```

**Error:**
```json
{ "success": false, "message": "Human readable error", "status": "fail" }
```
(dev mode also includes `stack` and `error`)

**HTTP status codes used:** 200, 201, 400, 401, 403, 404, 409, 422, 500.

---

## 5. Data Models (what the frontend will render)

### User
```
firstName, lastName, email, phone, role (jobseeker|employer|admin|superadmin)
status (pending|active|suspended|banned)
isVerified, isEmailVerified, isPhoneVerified, profileCompleted (0-100)
avatar { publicId, secureUrl }
jobPreferences { categories[], jobTypes[], locations[], salaryMin, salaryMax, workplaceType }
resume { publicId, secureUrl, filename, uploadedAt }   // quick single resume upload
gender, dateOfBirth, nationality, currentCity, address
headline, bio, skills[], expectedSalary, noticePeriod, totalExperience
socialLinks { linkedin, github, twitter, facebook, website }
notificationSettings { emailOnApplication, emailOnMessage, emailOnJobAlert, emailOnPackageExpiry, pushNotifications, smsNotifications }
socialMedia (google|linkedin|facebook), googleId, linkedinId
permissions[]  // admin only
profileViews, lastLogin, lastActive, loginCount
createdAt, updatedAt
```

### Job
```
uid (owner), companyId, title, slug
categoryId, subcategoryId, jobType, careerLevel, educationId, departmentId, tags[]
status (draft|pending|approved|rejected|expired|paused|deleted)
isUrgent, urgentUntil
description, qualifications, prefferdSkills, applyInfo
company, city, zipcode, address1/2, latitude/longitude, workplaceType (onsite|remote|hybrid)
companyUrl, contactName/Phone/Email, showContact, jobApplyLink, jobLink
hideSalaryRange, salaryType, salaryMin, salaryMax, currency
experience, noOfJobs, duration
startPublishing, stopPublishing, expiresAt (auto: +30 days on create)
isGoldJob, isFeaturedJob (+ start/end dates)
viewsCount, applicationsCount, hits
createdAt / updatedAt
```
Virtuals: `isExpired`, `isActive`.

### Company
```
uid (owner), name, slug, url, contactEmail, tagline, description
logo { publicId, secureUrl }, smallLogo, gallery[] (up to 10 images)
city, address1/2
isVerified, verificationStatus (not_submitted|pending|approved|rejected), verificationDocuments[]
status (0/1), isGoldCompany, isFeaturedCompany (+dates)
socialLinks { facebook, twitter, linkedin, youtube, instagram, website }
hits, followersCount, jobsCount
```

### Resume
```
uid (owner), applicationTitle, firstName, lastName, gender, emailAddress, cell, nationality
photo, jobCategory, jobType, salaryFixed, keywords, tags[]
published, searchable, visibility (public|private|restricted), quickApply
resume (text/summary), skills
institutes[] { institute, certificateName, studyArea, fromDate, toDate }
employers[] { employer, fromDate, toDate, currentStatus, city, position, phone, address }
languages[] { language, proficiency }
addresses[] { address, city, longitude, latitude }
files[] { publicId, secureUrl, filename, filetype, filesize }
isGoldResume, isFeaturedResume (+dates)
atsScore (0-100), completionPercentage (0-100)
hits, viewsCount, downloadCount
shareToken  // for public share links
```

### Application
```
jobId, uid (applicant), cvId (resume), companyId, coverLetterId
applyMessage, comments, quickApply
status: applied|reviewed|shortlisted|interview_scheduled|interviewed|offered|hired|rejected|withdrawn
statusHistory[] { status, note, changedBy, changedAt }
resumeView, resumeViewedAt, rating (0-5), employerNotes, candidateNotes
interviewDate, interviewType (in_person|phone|video|technical), interviewLink, interviewNotes
resumeSnapshot  // frozen copy of resume at time of apply
```
Note: one application per (jobId, uid) — duplicate applies are blocked (409).

### Package (subscription plan)
```
title, isFree, price, packageTime, packageTimeUnit (days|months|years)
Quotas: companies, featuredCompany, job, featuredJob, resume, featuredResume,
        department, coverletter, jobSearch, resumeSearch, jobAlert, jobApply,
        resumeContactDetail, companyContactDetail
jobTime, jobTimeUnit  // how long a posted job stays live
discount, discountType, currencyId, packageFor (employer|jobseeker|both)
stripePlanId, paypalSubscription, stripeSubscription
status
```

### UserPackage (active subscription instance)
```
uid, packageId, endDate, status, isActive
remainingJobs, remainingFeaturedJobs, remainingResumes, remainingFeaturedResumes,
remainingCompanies, remainingJobAlerts, remainingJobApply, remainingResumeSearch
autoRenew, subscriptionId, paymentHistoryId
```
> Every quota-limited action (post job, apply, add resume...) checks this before proceeding and returns `403` if the quota is exhausted or no active package exists.

### Invoice
```
uid, recordId (packageId), description, type (package|boost|addon)
amount, payMethod (stripe|paypal|bank|free|manual)
paymentStatus (pending|paid|failed|refunded|cancelled)
transactionId, paidAt
refundStatus (none|requested|processing|refunded), refundReason
payerName, payerEmail, paymentProof (bank transfers)
```

### Notification
```
recipientId, senderId, type (application_received|shortlisted|hired|rejected|
  interview_scheduled|offer_received|package_expiry|package_expired|payment_success|
  payment_failed|message_received|job_alert|company_followed|resume_viewed|
  profile_viewed|system|custom)
title, message, refModel, refId
isRead, readAt
channels { inApp, email, push, sms }
actionUrl, actionText
```

### Conversation & Message
```
Conversation: participants[], jobId, lastMessage, lastMessageAt, lastMessageText, unreadCount (Map)
Message: conversationId, sendBy, message, attachments[], replyToId, isRead, readBy[]
```

### Misc reference collections
`Category` (hierarchical via `parentId`), `JobType`, `CareerLevel`, `Education`, `SalaryRangeType`, `Currency`, `Country`, `State`, `City`, `Department`, `CoverLetter`, `JobAlert`, `JobShortlist`, `Tag`, `Follower`, `Report`, `SavedSearch`, `Folder` / `FolderResume`, `ActivityLog`, `SystemError`, `Setting`.

---

## 6. API Reference

Legend: 🔓 public · 🔑 authenticated (any role) · 👤 jobseeker · 🏢 employer · 🛡️ admin · 👑 superadmin

### 6.1 Auth — `/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | 🔓 | Create account (`firstName,lastName,email,password,role,phone`). Sends verification email. Rate-limited. |
| POST | `/login` | 🔓 | `{email,password}` → tokens + user. Rate-limited (5/15min). Blocked if `pending`/`suspended`/`banned`. |
| POST | `/refresh-token` | 🔓 | Body or cookie `refreshToken` → new token pair. |
| POST | `/logout` | 🔑 | Revokes current session. |
| POST | `/logout-all` | 🔑 | Revokes all sessions/devices. |
| POST | `/forgot-password` | 🔓 | `{email}` → sends reset link (always 200, no email enumeration). |
| PATCH | `/reset-password/:token` | 🔓 | `{password, confirmPassword}` |
| GET | `/verify-email/:token` | 🔓 | Activates account. |
| POST | `/resend-verification` | 🔓 | `{email}` |
| PATCH | `/change-password` | 🔑 | `{currentPassword, newPassword, confirmPassword}` → revokes all other sessions. |
| GET | `/me` | 🔑 | Current user profile. |
| GET | `/sessions` | 🔑 | List active devices/refresh tokens. |
| DELETE | `/sessions/:sessionId` | 🔑 | Revoke one device. |
| GET | `/google` | 🔓 | Redirects to Google consent screen. |
| GET | `/google/callback` | 🔓 | Redirects to `CLIENT_URL/oauth-callback#accessToken=..&refreshToken=..` |
| GET | `/linkedin` | 🔓 | Redirects to LinkedIn consent screen. |
| GET | `/linkedin/callback` | 🔓 | Same redirect pattern as Google. |

### 6.2 Users (profile) — `/users`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/profile` | 🔑 | Full own profile. |
| PATCH | `/profile` | 🔑 | Update profile fields (password/email/role/status blocked). Auto-recalculates `profileCompleted`. |
| POST | `/avatar` | 🔑 | multipart `avatar` file → uploads & crops to 300x300 face-centered. |
| PATCH | `/notification-settings` | 🔑 | Update notification toggles. |
| DELETE | `/account` | 🔑 | Soft-deletes own account. |
| POST | `/resume` | 🔑 | multipart `resume` file → quick single-resume upload (separate from the full Resume documents below). |

### 6.3 Jobs — `/jobs`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔓 | List/search jobs. Query: `keyword,category,subcategory,jobType,city,country,workplaceType,isUrgent,company,experience,tags,salaryMin,salaryMax,sort(newest|oldest|salary_high|salary_low|relevance),page,limit`. Cached 120s. |
| GET | `/featured` | 🔓 | Featured jobs, `?limit=8`. |
| GET | `/stats` | 🔓 | Platform totals: `{totalJobs, totalCompanies, totalUsers, totalApplications}` — good for a homepage counter. |
| GET | `/my-jobs` | 🏢 | Own posted jobs, `?status=`. |
| GET | `/shortlisted` | 🔑 | Own shortlisted jobs. |
| GET | `/:id` | 🔓 | Single job by id or slug. Increments view count. Returns `{job, isShortlisted, similarJobs}`. Non-approved jobs hidden from jobseekers/guests. |
| GET | `/:id/analytics` | 🏢 | Views/applications/status breakdown (owner only). |
| POST | `/` | 🏢 | Create job (auto-attaches employer's company). Checks package quota. Status becomes `pending` (or `approved` if admin posts). |
| PATCH | `/:id` | 🔑(owner)/🛡️ | Update job. Non-admins can't directly set arbitrary status. |
| DELETE | `/:id` | 🔑(owner)/🛡️ | Soft delete. |
| POST | `/:id/shortlist` | 🔑 | Toggle shortlist (bookmark). |
| PATCH | `/:id/moderate` | 🛡️ | `{status: approved|rejected|paused, note}` → notifies + emails employer. |

### 6.4 Job Alerts — `/job-alerts`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔑 | Own alerts. |
| POST | `/` | 🔑 | Create alert (category, keywords, city, jobType, etc.) — matches sent via email every 6h by cron. |
| PATCH | `/:id` | 🔑 | Update. |
| DELETE | `/:id` | 🔑 | Soft delete. |

### 6.5 Companies — `/companies`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔓 | List. Query: `keyword,city,verified,sort(followers),page,limit`. |
| GET | `/my-company` | 🏢 | Own company profile. |
| GET | `/:id` | 🔓 | By id or slug → `{company, isFollowing, recentJobs}`. |
| POST | `/` | 🏢 | Create (one per employer — 409 if exists). |
| PATCH | `/:id` | 🔑(owner)/🛡️ | Update (verification fields blocked for non-admin). |
| POST | `/logo` | 🏢 | multipart `logo`. |
| POST | `/gallery` | 🏢 | multipart `image` (max 10 total). |
| DELETE | `/gallery` | 🏢 | `{publicId}` |
| POST | `/verify/submit` | 🏢 | multipart `documents` (up to 5) → sets `verificationStatus: pending`. |
| POST | `/:id/follow` | 🔑 | Toggle follow. |
| PATCH | `/:id/verify` | 🛡️ | `{status: approved|rejected, note}` → notifies + emails. |
| GET | `/admin/all` | 🛡️ | All companies incl. unverified. |

### 6.6 Followers — `/followers`
| GET | `/following` | 🔑 | Companies the current user follows. |

### 6.7 Resumes — `/resumes`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🏢 | Search resume database. Query: `keyword,category,jobType,visibility,page,limit`. |
| GET | `/my` | 🔑 | Own resumes. |
| GET | `/:id` | 🔓 (optional auth) | Full resume. `private` visibility blocked for non-owner/non-admin. Increments views unless owner. |
| GET | `/share/:token` | 🔓 | Resume via public share link. |
| POST | `/` | 👤 | Create resume (checks package quota). |
| PATCH | `/:id` | 🔑(owner)/🛡️ | Update, auto-recalculates `completionPercentage`. |
| DELETE | `/:id` | 🔑(owner)/🛡️ | Soft delete. |
| POST | `/:id/upload` | 🔑(owner) | multipart `file` → adds to `files[]`. |
| DELETE | `/:id/files/:publicId` | 🔑(owner) | Remove a file. |
| PATCH | `/:id/visibility` | 🔑(owner) | `{visibility, searchable}` |
| POST | `/:id/share` | 🔑(owner) | Generates a new `shareToken`/URL. |
| PATCH | `/:id/feature` | 🔑 | Toggles featured status (30-day window). |

### 6.8 Applications — `/applications`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | 👤 | `{jobId, cvId, coverLetterId, applyMessage, quickApply}` → checks quota, prevents duplicates, snapshots resume, notifies+emails employer & applicant. |
| GET | `/my` | 👤 | Own applications, `?status=`. |
| GET | `/company-overview` | 🏢 | Stats + 5 most recent across all own jobs. |
| GET | `/job/:jobId` | 🏢(owner) | Applications for one job. Query: `status,rating,page,limit`. |
| GET | `/:id` | 🔑 | Single application (applicant, job owner, or admin only). Marks `resumeView` for employers. |
| PATCH | `/:id/status` | 🏢(owner) | `{status, note, interviewDate, interviewType, interviewLink}` → notifies+emails applicant. |
| PATCH | `/:id/withdraw` | 👤(owner) | `{reason}` — blocked once `hired`/`rejected`. |
| PATCH | `/:id/rate` | 🏢(owner) | `{rating (0-5), notes}` |

### 6.9 Packages — `/packages`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔓 | List active packages, `?for=employer\|jobseeker`. |
| GET | `/my-package` | 🔑 | Own currently active package + remaining quotas. |
| GET | `/:id` | 🔓 | Single package. |
| POST / PATCH / DELETE | `/` `/:id` `/:id` | 🛡️ | Admin CRUD (delete = deactivate). |

### 6.10 Payments — `/payments`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/stripe/webhook` | 🔓 (Stripe signed) | Raw-body webhook. Handles `checkout.session.completed` (activates package) and `payment_intent.payment_failed`. |
| POST | `/stripe/create-session` | 🔑 | `{packageId}` → `{sessionId, sessionUrl, invoiceId}`. Redirect user to `sessionUrl`. |
| POST | `/paypal/create-order` | 🔑 | `{packageId}` → `{orderId, invoiceId}`. |
| POST | `/paypal/capture` | 🔑 | `{orderId}` → captures & activates package. |
| POST | `/bank/submit-proof` | 🔑 | multipart `proof` + `{packageId}` → pending invoice, admin must approve. |
| GET | `/bank-transfers` | 🛡️ | All bank-transfer invoices. |
| PATCH | `/bank/:invoiceId/status` | 🛡️ | `{status: pending\|paid\|rejected\|failed}`. |
| PATCH | `/bank/:invoiceId/approve` | 🛡️ | Marks paid & activates package. |
| POST | `/free/activate` | 🔑 | `{packageId}` for `isFree` packages (blocked if already has active package). |
| GET | `/history` | 🔑 | Own invoice history, paginated. |
| POST | `/:id/refund` | 🔑(owner) | `{reason}` — only on `paid` invoices, once. |

**Frontend payment flow (Stripe):** call `create-session` → redirect to `sessionUrl` (Stripe Checkout) → on success/cancel Stripe redirects back to `${CLIENT_URL}/payment/success?session_id=...` or `/payment/cancel` — poll `/payments/history` or `/packages/my-package` to confirm activation (webhook does the actual activation server-side).

### 6.11 Notifications — `/notifications`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | 🔑 | List, `?unread=true`, paginated. |
| GET | `/unread-count` | 🔑 | `{count}` — poll or use socket event instead (see §7). |
| PATCH | `/read-all` | 🔑 | Mark all read. |
| PATCH | `/:id/read` | 🔑 | Mark one read. |
| DELETE | `/:id` | 🔑 | Soft delete. |

### 6.12 Messages — `/messages`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/conversations` | 🔑 | List own conversations, paginated, sorted by last activity. |
| POST | `/conversations` | 🔑 | `{recipientId, jobId?}` → get-or-create conversation. |
| GET | `/conversations/:conversationId` | 🔑(participant) | Messages, paginated (oldest→newest after reverse), marks unread as read. |
| POST | `/conversations/:conversationId` | 🔑(participant) | `{message, replyToId?}` + multipart `attachments` (up to 5) → sends, emits socket event, notifies. |
| DELETE | `/:messageId` | 🔑(sender) | `{deleteForEveryone: bool}` |

### 6.13 Uploads (generic) — `/uploads`
| POST | `/image` | 🔑 | multipart `file`, `?folder=avatar\|company_logo\|...` |
| POST | `/file` | 🔑 | multipart `file` (pdf/doc/docx too) |
| POST | `/multiple` | 🔑 | multipart `files` (up to 5) |
| DELETE | `/delete/:publicId` | 🔑 | Removes from Cloudinary |

### 6.14 Reference / Lookup Data — `/categories`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/categories` | 🔓 | All active categories (cached 1h). |
| GET | `/job-types` | 🔓 | Cached. |
| GET | `/career-levels` | 🔓 | Cached. |
| GET | `/education` | 🔓 | Cached. |
| GET | `/currencies` | 🔓 | Cached. |
| GET | `/countries` | 🔓 | Cached, minimal fields. |
| GET | `/states/:countryId` | 🔓 | |
| GET | `/cities/:stateId` | 🔓 | |
| POST/PATCH/DELETE | `/categories(/:id)` | 🛡️ | Admin CRUD, invalidates cache. |
| POST/PATCH/DELETE | `/job-types(/:id)` | 🛡️ | Admin CRUD. |

> Use these to populate every dropdown in job-posting/resume/search forms (category, job type, career level, education, currency, country → state → city cascade).

### 6.15 Analytics — `/analytics`
| GET | `/employer` | 🏢 | `{totalJobs, totalApplications, applicationsByStatus[], topJobs[]}` |
| GET | `/jobseeker` | 👤 | `{totalApplications, applicationsByStatus[], profileViews}` |

### 6.16 Search — `/search`
| GET | `/` | 🔓 (optional auth) | `?q=&type=jobs\|companies\|resumes&page=&limit=`. `resumes` type requires employer role. Cached 60s. |
| GET | `/saved` | 🔑 | Own saved searches. |
| POST | `/saved` | 🔑 | `{searchName, searchParams}` |
| DELETE | `/saved/:id` | 🔑 | |

### 6.17 Interviews — `/interviews`
| GET | `/` | 🔑 | Upcoming interviews — employer sees interviews across own jobs, jobseeker sees own. |

### 6.18 Reports (flag content) — `/reports`
| POST | `/` | 🔑 | `{refModel: Job\|Company\|Resume\|User, refId, reason, description}` |

### 6.19 Admin Panel — `/admin` (all require 🛡️ admin, superadmin-only rows marked 👑)
| Method | Path | Notes |
|---|---|---|
| GET | `/settings/bank/public` | 🔓 — public bank details for bank-transfer UI |
| GET | `/dashboard` | Full stats: users, jobs, companies, applications, resumes, revenue, recent activity (cached 60s) |
| GET | `/users` `/users/:id` | List/detail (admin can't see other admins) |
| PATCH | `/users/:id/status` | `{status, reason}` → emails user |
| DELETE | `/users/:id` | Soft delete |
| GET | `/user-packages` | Filter by `uid`, `isActive` |
| GET | `/jobs` | All jobs incl. deleted, filter by status/company/search |
| GET | `/companies` `/companies/:id/verify` | List + verify |
| GET | `/reports` `/reports/:id` (PATCH) | Moderation queue |
| GET | `/activity-logs` | Audit trail |
| GET | `/invoices` | All invoices |
| GET | `/bank-transfers` + approve/status | Pending bank payments |
| `permission: revenue` → GET `/revenue` | Monthly revenue, by payment method, by package, refunds |
| `permission: analytics` → GET `/analytics` | Platform-wide growth charts (`?days=30`) |
| `permission: packages` → GET `/packages-list` | |
| `permission: categories` → POST/PATCH/DELETE `/categories` | |
| `permission: refunds` → GET `/refunds`, PATCH `/refunds/:invoiceId` | |
| `permission: broadcast` → POST `/broadcast` | `{title, message, targetRole, sendEmail}` → bulk notification |
| 👑 `/admins` (GET/POST/PATCH status/DELETE) | Manage admin accounts |
| 👑 `/admins/:id/permissions` (GET/PATCH) | `{permissions: [revenue,analytics,packages,categories,refunds,broadcast]}` |
| 👑 `/system-errors` `/system-errors/all` | Error log viewer |
| 👑 `/settings` (GET/PATCH), `/settings/bank` (PATCH) | Site-wide key-value settings |
| 👑 `/packages` (POST/PATCH/DELETE) | Package management |
| 👑 `/assign-package` | `{userId, packageId, days}` — manual grant, free of charge |
| 👑 `/cache/clear` | `{pattern?}` — flush Redis cache |

---

## 7. Real-time (Socket.io)

**Connect:** `io(SERVER_URL, { auth: { token: accessToken } })` — JWT required at handshake.

Every user auto-joins room `user:<userId>`.

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join_conversation` | client → server | `conversationId` | Join a chat room |
| `leave_conversation` | client → server | `conversationId` | Leave a chat room |
| `typing_start` / `typing_stop` | client → server | `{conversationId}` | Typing indicator |
| `user_typing` / `user_stopped_typing` | server → client | `{userId, conversationId}` | Broadcast to room |
| `new_message` | server → client | `{conversationId, message}` | New chat message (sent to room `user:<id>` of recipients) |
| `notification` | server → client | notification object | Any new notification (application update, message, payment, etc.) — use this instead of polling `/notifications/unread-count` |
| `user_online` / `user_offline` | server → broadcast | `{userId}` | Presence |

---

## 8. Business Rules Frontend Must Respect

1. **Quota gating** — Posting a job, applying, creating a resume, sending a job alert, etc. all require an active `UserPackage` with `remaining* > 0` (or `-1` = unlimited). Show a clear "upgrade your package" CTA on `403` responses mentioning "limit".
2. **Job posting workflow** — new jobs start as `pending`; only visible publicly once `approved` by an admin. Show "Pending Review" state to the employer.
3. **Company required before job post** — employer must create a Company profile first (job creation auto-attaches it).
4. **One application per job** — disable the Apply button if `applications/my` already contains that jobId.
5. **Resume visibility** — `private` resumes are invisible to other employers; only owner/admin can view.
6. **Featured/Gold flags** — sort listings with `isFeaturedJob`/`isGoldJob` (and company/resume equivalents) first; these expire via `endFeaturedDate`/`endGoldDate` and cron will unset them.
7. **Soft deletes everywhere** — deleted records are excluded automatically by backend queries; frontend never needs to filter `isDeleted` itself.
8. **Email verification gate** — login is blocked (`403`) until `isEmailVerified`; show "resend verification" UI.
9. **Refund/withdraw rules** — applications can't be withdrawn once `hired`/`rejected`; invoices can only be refunded once and only if `paid`.

---

## 9. Suggested Frontend Route Map

```
/                          → Home (stats, featured jobs, categories)
/jobs                      → Job search/listing (filters: category, city, type, salary, etc.)
/jobs/:slug                → Job detail (apply button, similar jobs)
/companies                 → Company directory
/companies/:slug           → Company profile (jobs, gallery, follow button)
/resumes                   → Resume search (employer only)
/resumes/:id                → Resume detail
/login /register /verify-email/:token /forgot-password /reset-password/:token
/oauth-callback            → Reads tokens from URL hash after Google/LinkedIn redirect
/dashboard/jobseeker       → Applications, saved jobs, resumes, alerts, profile
/dashboard/employer        → My jobs, my company, applications per job, analytics
/dashboard/admin           → Users, jobs, companies, reports, revenue, settings
/messages                  → Conversations + chat window (socket-powered)
/notifications             → Notification center
/pricing                   → Packages list + checkout (Stripe/PayPal/Bank)
/payment/success /payment/cancel
```

---

## 10. Quick-Start Checklist for Frontend Dev

1. Set up axios/fetch client with `baseURL = http://localhost:5000/api/v1`, `withCredentials: true`.
2. Attach `Authorization: Bearer <accessToken>` on every request; on `401`, call `/auth/refresh-token` once and retry.
3. Store `accessToken`/`refreshToken` in memory + httpOnly cookies already set by the server — no need to also use localStorage.
4. Connect Socket.io right after login using the access token.
5. Fetch `/categories`, `/job-types`, `/career-levels`, `/education`, `/currencies`, `/countries` once at app load and cache in global state — they rarely change.
6. Use `/packages?for=employer` or `?for=jobseeker` to render the pricing page.
7. Gate protected routes client-side by `user.role` but always rely on server 403s as the source of truth.

---

*Generated from the backend source (controllers, models, routes, middleware, sockets, cron) — keep this file updated when endpoints change.*