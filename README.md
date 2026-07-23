# Mezgeb መዝገብ

Official Next.js production foundation for an Ethiopian small-business ledger covering sales, expenses, VAT-ready receipts, Dube customer credit, mobile money, reports, inventory and business operations.

## Status

The Apple-style marketing website now includes the complete interactive Mezgeb prototype at `/app`, so users can access the application without leaving the website. A smaller quick demo remains available at `/demo`. Production authentication and database capabilities are scaffolded but require a **dedicated Mezgeb Supabase project**, migration deployment, environment variables, legal review and security verification before real financial data is used.

## Application routes

- `/app` — complete embedded Mezgeb application with sample browser-local interactions
- `/demo` — lightweight quick demo
- `/dashboard` — protected production dashboard foundation
- `/auth/sign-in` and `/auth/sign-up` — Supabase SSR authentication routes

The complete prototype is stored as four compressed payload parts in `public/` and decompressed in the browser by `components/embedded-mezgeb-app.tsx`. This preserves the existing standalone application while keeping it inside the Next.js product experience and aligned with the website branding.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Supabase SSR authentication with cookie sessions
- PostgreSQL Row Level Security migration
- Vitest, Playwright, ESLint and Prettier
- GitHub Actions CI, CodeQL and Dependabot

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` and use `http://localhost:3000/app` for the integrated application.

## Supabase

1. Create a dedicated Supabase project for Mezgeb.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
4. Apply `supabase/migrations/202607230001_initial_schema.sql`.
5. Run Supabase security and performance advisors.

Do not apply the migration to another product's database.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Prototype safety

The `/app` and `/demo` routes use sample browser-local data. Never enter real financial, customer, TIN or personal data into an unconfigured deployment.
