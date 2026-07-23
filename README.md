# Mezgeb መዝገብ

Official Next.js application for an Ethiopian small-business ledger covering sales, expenses, VAT-ready receipts, Dube customer credit, mobile money, reports, inventory and business operations.

## Status

The marketing website and native `/app` workspace share one Mezgeb design system. Production Supabase authentication is connected to project `vcyzgoiconxjmntoreto`, and the protected account dashboard can create and load RLS-isolated business workspaces.

The visual application at `/app` still uses browser-local prototype transactions. Do not enter real financial data there until its ledger, Dube, receipts, inventory and reports are switched from local storage to the deployed `mezgeb_*` tables.

## Authentication routes

- `/auth/sign-up` — full-name, email and password registration
- `/auth/callback` — email-confirmation and recovery-code exchange
- `/auth/sign-in` — password authentication with safe return paths
- `/auth/forgot-password` — secure recovery email request
- `/auth/update-password` — authenticated password replacement
- `/auth/sign-out` — session termination
- `/dashboard` — protected business onboarding and workspace selection

Supabase SSR sessions are refreshed through `proxy.ts`. New Auth users automatically receive a `mezgeb_profiles` row through a locked database trigger.

## Application routes

- `/app` — native Next.js Mezgeb workspace with dashboard, ledger, receipts, Dube, reports and operations
- `/demo` — lightweight public product demo
- `/dashboard` — authenticated account and business workspace selector

## Connected database

The connected project already contained unrelated live-streaming tables. Mezgeb therefore uses conflict-safe namespaced tables and does not modify those existing records:

- `mezgeb_profiles`
- `mezgeb_businesses`
- `mezgeb_customers`
- `mezgeb_transactions`
- `mezgeb_receipts`
- `mezgeb_audit_logs`
- `mezgeb_deletion_requests`

All Mezgeb tables have Row Level Security enabled. Ownership policies restrict business data to the authenticated owner. The Supabase security advisor reports no unresolved findings after deployment.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Supabase Auth with cookie-based SSR sessions
- PostgreSQL Row Level Security
- Vitest, Playwright, ESLint and Prettier
- GitHub Actions CI, CodeQL and Dependabot

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Authentication uses the connected Mezgeb Supabase project defined in `.env.example` and `lib/supabase/config.ts`.

## Database migration

The deployed schema is tracked at:

```text
supabase/migrations/202607230002_mezgeb_authentication_and_business_foundation.sql
```

The earlier `202607230001_initial_schema.sql` is intentionally retired because it assumed an empty project and conflicted with the existing `profiles` table.

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

Authentication and business onboarding are backed by Supabase. The `/app` transaction screens remain browser-local until the next database-integration phase. Use sample data there only.
