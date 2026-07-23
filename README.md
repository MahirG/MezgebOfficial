# Mezgeb መዝገብ

Official Next.js application for an Ethiopian small-business ledger covering sales, expenses, VAT-ready receipts, Dube customer credit, mobile money, reports, inventory and business operations.

## Status

The marketing website and native `/app` workspace share one Mezgeb design system. Production Supabase authentication is connected to project `vcyzgoiconxjmntoreto`, and the protected account dashboard can create and load RLS-isolated business workspaces.

The visual application at `/app` still uses browser-local prototype transactions. Do not enter real financial data there until its ledger, Dube, receipts, inventory and reports are switched from local storage to the deployed `mezgeb_*` tables.

## Authentication routes

- `/auth/sign-up` — two-step Ethiopian registration with contact, location, language, role and limited ID details
- `/auth/check-email` — mandatory email-confirmation guidance and resend control
- `/auth/callback` — email-confirmation and recovery-code exchange
- `/auth/sign-in` — password authentication with safe return paths
- `/auth/forgot-password` — secure recovery email request
- `/auth/update-password` — authenticated password replacement
- `/auth/sign-out` — session termination
- `/dashboard` — protected business onboarding, plan visibility and workspace selection

Supabase SSR sessions are refreshed through `proxy.ts`. New Auth users automatically receive a `mezgeb_profiles` row and an active Free subscription through locked database triggers.

The registration form accepts Fayda, Ethiopian passport, Origin ID, Kebele/resident ID, driver’s license or another government-issued document. Only the document type and final four characters are stored. Registration does not claim that the identity is verified.

## Application routes

- `/app` — native Next.js Mezgeb workspace with dashboard, ledger, receipts, Dube, reports and operations
- `/demo` — lightweight public product demo
- `/pricing` — Supabase-backed Free and Pro plan selection
- `/dashboard` — authenticated account and business workspace selector

## Connected database

The connected project already contained unrelated live-streaming tables. Mezgeb therefore uses conflict-safe namespaced tables and does not modify those existing records:

- `mezgeb_profiles`
- `mezgeb_businesses`
- `mezgeb_customers`
- `mezgeb_transactions`
- `mezgeb_receipts`
- `mezgeb_plans`
- `mezgeb_subscriptions`
- `mezgeb_audit_logs`
- `mezgeb_deletion_requests`

All Mezgeb tables have Row Level Security enabled. Ownership policies restrict business data to the authenticated owner. Column-level grants prevent users from self-verifying identity or marking a paid subscription active.

Pricing is server-enforced: the browser may select only the plan and billing cycle. PostgreSQL recalculates the ETB amount, assigns the seven-day Pro trial once, and protects payment-provider and subscription-status fields.

## Supabase advisor status

Database RLS, foreign-key indexes and security-definer checks are clean. The only remaining Auth warning is **Leaked Password Protection Disabled**, which must be enabled in the Supabase Auth password-security settings before production launch.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Supabase Auth with cookie-based SSR sessions
- PostgreSQL Row Level Security and server-enforced subscription triggers
- Vitest, Playwright, ESLint and Prettier
- GitHub Actions CI, CodeQL and Dependabot

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Authentication uses the connected Mezgeb Supabase project defined in `.env.example` and `lib/supabase/config.ts`.

## Database migrations

The deployed conflict-safe schema and subsequent authentication, pricing and hardening migrations are tracked in `supabase/migrations/`. The retired `202607230001_initial_schema.sql` assumed an empty project and should not be applied to the connected database.

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Data safety

Authentication, profile onboarding, pricing and business creation are backed by Supabase. The `/app` transaction screens remain browser-local until the next database-integration phase. Use sample data there only.
