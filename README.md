# PayBridge — The bridge between CRM, ERP & payments.

## 📌 Problem Statement
Organizations struggle with disconnected CRM, ERP, and payment systems — forcing finance teams into manual reconciliation, error-prone data exports, and a lack of real-time visibility into their revenue pipeline.

## 💡 Solution
PayBridge acts as a middleware orchestration layer that bridges Salesforce (CRM), NetSuite (ERP), and Stripe (Payments) — automating the full order-to-cash lifecycle from a single dashboard.

## 🧠 Who Is This For
- **Target Users:** Enterprises, finance teams, and SaaS platforms managing high-volume B2B invoicing
- **Pain Points Solved:**
  - Data silos between CRM, ERP, and payment systems
  - Manual invoice matching and reconciliation
  - No real-time visibility into deal-to-payment progress
- **Core Value:** One unified workflow from closed deal → invoice → onboarding → payment

## 📊 Impact & Metrics (Simulated)
- 🔄 Reduced manual reconciliation effort by 60%
- ⏱️ Improved end-to-end financial workflow efficiency by 40%
- 📊 Enabled near real-time visibility across the full payment pipeline
- ⚡ Rapid prototype built using AI-assisted development (Cursor + Claude)

## 🔮 Future Enhancements
- Real-time revenue dashboards with drill-down analytics
- AI-based anomaly detection for failed payments and overdue invoices
- Role-based access for finance, ops, and admin teams

-------------------------------------------------

A production-ready payment pipeline platform that automates the full payment lifecycle: syncing deals from Salesforce, matching invoices in NetSuite, onboarding hosts via Stripe Connect, and collecting payments — all from a single dashboard.

## 🚀 Features

### 📋 4 Core Workflow Stages
1. **Salesforce Sync** — Pull closed-won opportunities from Salesforce CRM automatically
2. **NetSuite Invoice Matching** — Fetch and match invoices from NetSuite ERP by account
3. **Stripe Host Onboarding** — Send Connect onboarding links and track completion status
4. **Payment Collection** — Charge via Stripe PaymentIntents with retry and webhook support

### 🎨 Frontend Features
- **React + Vite** single-page app with TailwindCSS
- **Pipeline Stepper** — visual 4-step workflow tracker per opportunity
- **Tabbed Detail View** — Overview, Invoice, Payment, and Audit Log per record
- **Live Status Badges** — PENDING → INVOICE_FETCHED → INVITE_SENT → PAYMENT_SUCCEEDED
- **Toast notifications** for all actions
- **JWT-authenticated** session with auto-redirect

### ⚡ Backend Features
- **Express + TypeScript** REST API with Zod-validated environment
- **Prisma ORM** with PostgreSQL (full schema with migrations)
- **Bull queue + Redis** for background job processing
- **4 background jobs**: Salesforce sync, invoice matching, onboarding polling, payment retry
- **Stripe webhooks** with raw body signature verification
- **Winston structured logging** with HTTP request logging
- **Rate limiting** (200 req / 15 min) and Helmet security headers
- **Demo mode** — full mock API requiring zero external credentials

### 🔌 Integrations
| Service | Purpose | Auth Method |
|---|---|---|
| Salesforce CRM | Closed-won opportunity sync | OAuth 2.0 / Username-Password |
| NetSuite ERP | Invoice fetch and matching | OAuth 1.0a REST API |
| Stripe Payments | Connect accounts + PaymentIntents + Webhooks | Secret key + Webhook signing |
| SendGrid | Onboarding invite emails | API key |

## 🛠️ How to Use

### Quick Start (Demo — no credentials needed)
1. Visit **[https://paybridge-ar.vercel.app](https://paybridge-ar.vercel.app)**
2. Log in with the demo credentials:
   ```
   Email:    admin@paybridge.com
   Password: admin123
   ```
3. Explore all 4 opportunities across different pipeline stages

### Opportunity Workflow
```
PENDING → Fetch Invoice → INVOICE_FETCHED → Invite Host → INVITE_SENT → Onboard → PAYMENT_SUCCEEDED
```

### Interactive Features

#### Opportunities List
- **Search** by name, account, or email
- **Filter** by status (Pending, Invoice Fetched, Invite Sent, etc.)
- **Sync from Salesforce** — pulls and updates all opportunities
- **Click any row** to open the detail view

#### Opportunity Detail — Overview Tab
- Full Salesforce metadata (ID, stage, close date, amount)
- Stripe account status (onboarding progress, charges enabled)
- One-click action buttons based on current pipeline stage

#### Opportunity Detail — Invoice Tab
- **Fetch Invoice from NetSuite** — matches and stores the invoice
- Line item breakdown with quantity, unit price, and totals
- NetSuite invoice ID and due date

#### Opportunity Detail — Payment Tab
- Stripe PaymentIntent creation and collection
- Full payment history with intent IDs and statuses
- Retry support for failed payments

#### Opportunity Detail — Audit Log Tab
- Timestamped event trail for every action
- Events: OPPORTUNITY_SYNCED, INVOICE_FETCHED, HOST_INVITED, ONBOARDING_COMPLETE, PAYMENT_SUCCEEDED

#### Stripe Onboarding Flow
- Clicking **"View Onboarding Link"** opens a full mock Stripe Express onboarding
- 4-step flow: Welcome → Business Info → Bank Account → Identity Verification
- Progress bar, Stripe branding, and form validation
- Returns to the opportunity detail on completion

### Keyboard Shortcuts
- **Enter** — Submit forms / confirm actions
- **Escape** — Close modals
- **Tab** — Navigate between elements

## 📁 File Structure

```
paybridge/
├── api/
│   └── index.ts                  # Vercel serverless handler (standalone, no external deps)
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios API clients (auth, opportunities, sync, audit)
│   │   ├── components/           # Shared UI (StatusBadge, PipelineStepper, InvoicePanel, etc.)
│   │   ├── hooks/                # useAuth hook
│   │   ├── pages/                # LoginPage, OpportunitiesPage, OpportunityDetailPage, DemoOnboardingPage
│   │   └── types/                # TypeScript interfaces (Opportunity, Invoice, StripeAccount, etc.)
│   ├── vite.config.ts
│   └── tailwind.config.js
├── prisma/
│   ├── schema.prisma             # Full DB schema (Opportunity, Invoice, StripeAccount, PaymentRecord, AuditLog, User)
│   ├── migrations/               # Prisma migration history
│   └── seed.ts                   # Seed script with 3 sample opportunities
├── src/
│   ├── api/                      # Express route handlers (auth, sync, opportunities, webhooks, audit, cron)
│   ├── config/
│   │   └── env.ts                # Zod-validated environment config with demo mode support
│   ├── db/
│   │   └── client.ts             # Prisma client singleton
│   ├── jobs/                     # Bull queue jobs (salesforceSync, invoiceMatch, onboardingPoll, retryPayment)
│   ├── middleware/               # errorHandler, webhookRaw, demo
│   ├── services/                 # salesforce.ts, netsuite.ts, stripe.ts, email.ts (+ .mock.ts variants)
│   ├── utils/                    # logger (Winston)
│   ├── app.ts                    # Express app setup
│   └── index.ts                  # Server entrypoint
├── vercel.json                   # Vercel deployment config (zero-config, SPA rewrites, cron jobs)
├── .env.example                  # Full environment variable documentation
└── README.md
```

## 🎯 Design System

### Colors
- **Primary Brand**: `#6366f1` Indigo (buttons, active states, stepper)
- **Success Green**: `#10b981` (payment succeeded, verified status)
- **Warning Yellow**: `#f59e0b` (invite sent, pending states)
- **Error Red**: `#ef4444` (payment failed, error states)
- **Neutral Gray**: `#f9fafb` (page background)
- **Dark Sidebar**: `#111827` (navigation)

### Typography
- **Font**: System UI / Inter (Google Fonts)
- **Page Titles**: 20px, Bold
- **Section Labels**: 11px, Uppercase, Letter-spaced
- **Body**: 14px, Regular
- **Mono**: Invoice IDs, Stripe account IDs (`font-mono`)

### Spacing & Layout
- **Base Unit**: 4px (Tailwind scale)
- **Card Padding**: 24px
- **Section Gap**: 24px
- **Border Radius**: 8px (cards), 6px (buttons), 9999px (badges)

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for quick DB/Redis setup)

### Setup

```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Copy and configure environment
cp .env.example .env
# Edit .env — or set DEMO_MODE=true to skip all external services

# 4. Start PostgreSQL and Redis (Docker)
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
docker run -d --name redis -p 6379:6379 redis:7

# 5. Run database migrations and seed
npx prisma migrate dev
npx prisma db seed

# 6. Start the backend
npm run dev

# 7. Start the frontend (separate terminal)
cd frontend && npm run dev
# → http://localhost:5173 (proxied to backend at :3001)
```

### Available Scripts

#### Backend
```bash
npm run dev           # Start with ts-node-dev (hot reload)
npm run build         # Compile TypeScript → dist/
npm start             # Run compiled production build
npm test              # Run Jest test suite (16 tests)
npm run test:watch    # Watch mode
npm run typecheck     # Type check without emitting
npm run prisma:studio # Open Prisma DB browser UI
npm run prisma:seed   # Re-seed the database
```

#### Frontend
```bash
npm run dev           # Vite dev server on :5173
npm run build         # Production build → dist/
npm run vercel-build  # Vercel build → ../public/
npm run lint          # ESLint check
```

### Demo Mode (no external services)
Set `DEMO_MODE=true` to skip all database and external service connections. All API calls return realistic mock data in-memory.

```bash
DEMO_MODE=true npm run dev
```

## 🌐 API Reference

All routes require `Authorization: Bearer <token>` except login.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate → returns JWT + user |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/sync/salesforce` | Trigger Salesforce opportunity sync |
| GET | `/api/opportunities` | List opportunities (filter, search, paginate) |
| GET | `/api/opportunities/:id` | Get full opportunity with invoice, payments, audit |
| POST | `/api/opportunities/:id/fetch-invoice` | Fetch + store matching NetSuite invoice |
| POST | `/api/opportunities/:id/invite-host` | Create Stripe account + send onboarding email |
| POST | `/api/opportunities/:id/charge` | Create Stripe PaymentIntent |
| GET | `/api/audit/:opportunityId` | Get audit log events for an opportunity |
| POST | `/api/webhooks/stripe` | Receive and process Stripe webhook events |
| GET | `/api/cron/salesforce-sync` | Vercel cron: daily Salesforce sync |
| GET | `/api/cron/onboarding-poll` | Vercel cron: poll Stripe for completed onboardings |

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

## ⚙️ Environment Variables

### Required (production)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-minimum-32-characters

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_USERNAME=...
SALESFORCE_PASSWORD=...

NETSUITE_ACCOUNT_ID=...
NETSUITE_CONSUMER_KEY=...
NETSUITE_CONSUMER_SECRET=...
NETSUITE_TOKEN_ID=...
NETSUITE_TOKEN_SECRET=...
```

### Optional
```env
DEMO_MODE=true               # Full mock mode — no DB or external services needed
NETSUITE_MOCK=true           # Mock NetSuite only, keep real Stripe + Salesforce
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG....
CORS_ORIGIN=https://yourdomain.com
PORT=3001
NODE_ENV=production
```

## 🏗️ Background Jobs

| Job | Schedule | Description |
|---|---|---|
| `salesforceSyncJob` | Daily 8:00 AM UTC | Sync closed-won deals from Salesforce |
| `invoiceMatchJob` | On demand | Match PENDING opportunities to NetSuite invoices |
| `onboardingStatusJob` | Daily 9:00 AM UTC | Poll Stripe for completed Connect onboardings |
| `retryPaymentJob` | On demand | Retry PAYMENT_FAILED opportunities with exponential backoff |

> In Vercel (serverless), Bull queues are disabled. Cron jobs run via Vercel Cron at `/api/cron/*`.

## 🗄️ Database Schema

```
Opportunity ──┬──< Invoice         (one-to-one)
              ├──< StripeAccount   (one-to-one)
              ├──< PaymentRecord   (one-to-many)
              └──< AuditLog        (one-to-many)

User                               (standalone — JWT auth)
```

Key enums: `OpportunityStatus`, `InvoiceStatus`, `OnboardingStatus`, `PaymentStatus`

## 🚀 Deployment

### Vercel (recommended)
```bash
npx vercel --prod
```
- **API**: `api/index.ts` auto-detected as a serverless function (standalone, zero native deps)
- **Frontend**: Vite build via `buildCommand`, output to `public/` via `outputDirectory`
- **Cron**: Daily Salesforce sync at 08:00 UTC, onboarding poll at 09:00 UTC
- **Environment**: Set all required env vars in Vercel project settings

### Self-hosted
```bash
npm run build
cd frontend && npm run build && cd ..
NODE_ENV=production node dist/index.js
```

### Environment Requirements (self-hosted)
- PostgreSQL database accessible at `DATABASE_URL`
- Redis accessible at `REDIS_URL`
- Stripe webhook endpoint registered at `https://yourdomain.com/api/webhooks/stripe`

## 🧪 Testing

### Run Tests
```bash
npm test               # All 16 tests
npm run test:watch     # Watch mode for development
```

### Test Coverage
| Suite | Tests | What's Covered |
|---|---|---|
| `app.test.ts` | 3 | Health check, 404 handler, CORS headers |
| `auth.test.ts` | 4 | Login success/failure, `/me` auth guard |
| `opportunities.test.ts` | 4 | List, detail, fetch-invoice, invite-host |
| `retry.test.ts` | 2 | Payment retry job logic and backoff |
| `stripe-webhook.test.ts` | 3 | Webhook signature verification, event dispatch |

### Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Device Testing
- ✅ Desktop (1280px+)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

## 🔒 Security

- **Helmet** — sets 11 HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — origin-restricted, configurable via `CORS_ORIGIN`
- **Rate limiting** — 200 requests per 15 minutes per IP
- **JWT** — HS256, 24-hour expiry, verified on every protected route
- **Stripe webhooks** — raw body HMAC-SHA256 signature verification before processing
- **Bcrypt** — password hashing with cost factor 10
- **Zod** — environment variable validation at startup, fails fast on misconfiguration

## 📈 Future Enhancements

### Product
- **Multi-currency support** — invoices in non-USD currencies via Stripe currency conversion
- **Bulk operations** — batch fetch invoices or batch charge multiple opportunities
- **Email templates** — customizable HTML onboarding invite emails
- **Role-based access** — admin vs. read-only viewer roles with route guards
- **Dashboard analytics** — revenue charts, pipeline conversion funnel, aging reports

### Technical
- **Docker Compose** — one-command local stack (app + postgres + redis)
- **Refresh tokens** — sliding session with short-lived access tokens
- **Real-time updates** — WebSocket or SSE for live payment status changes
- **E2E tests** — Playwright or Cypress covering the full workflow
- **OpenAPI spec** — auto-generated from route definitions for SDK generation
- **Terraform** — infrastructure as code for AWS/GCP self-hosted deployment

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run `npm test` to verify all tests pass
4. Make changes and add tests for new behaviour
5. Run `npm run typecheck` and `npm run lint`
6. Submit a pull request

### Code Standards
- TypeScript strict mode — no implicit `any`
- Zod for runtime validation at API boundaries only
- Winston for all logging (no `console.log` in production paths)
- Prisma transactions for multi-table writes
- `express-async-errors` — all async route handlers errors propagate automatically

## 📄 License

MIT — free to use and modify.

---

**Built with Node.js · TypeScript · React · Prisma · Stripe · Salesforce · NetSuite**
